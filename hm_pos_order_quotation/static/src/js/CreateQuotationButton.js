odoo.define("pos_order_quotation.CreateQuotationButton", function(require) {
    "use strict";

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {
        useListener
    } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');

    class CreateQuotationButton extends PosComponent {

        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }

        get client() {
            return this.env.pos.get_client();
        }

        get currentOrder() {
            return this.env.pos.get_order();
        }

        async onClick() {
            
            var self = this;
            var quotation_number = null;

            //Validação Produtos
            if (!this.currentOrder.export_as_JSON().lines.length) {
                this.showPopup('QuotationPopUpAlert', {
                    title: this.env._t('Alerta'),
                    body: this.env._t('Selecione ao menos um produto'),
                })
                return;
            }
            //Validação Cliente
            if (!self.client) {
                this.showPopup('QuotationPopUpAlert', {
                    title: this.env._t('Alerta'),
                    body: this.env._t('Selecione o cliente.'),
                })
                return;
            }
            //Testa conexão
            try {
                quotation_number = await this.rpc({
                    model: 'pos.quotation',
                    method: 'get_quotation_number',
                    args: [],
                    kwargs: {
                        context: this.env.session.user_context
                    },
                })
            } catch (error) {
                this.showPopup('QuotationPopUpAlert', {
                    title: this.env._t('Erro'),
                    body: this.env._t("Não foi possível acessar o servidor. Tente novamente mais tarde!"),
                })
                return;
            }
            const {
                confirmed,
                payload,
                print
            } = await this.showPopup('SaveQuotationPopUp', {
                title: this.env._t('Criar Cotação'),
                startingValue: '',
                quotationNumber: quotation_number,
                customer: self.client,
            });
            if (confirmed) {
                var returnOk = false;
                if (print) {
                    self.showScreen("ReceiptScreen");
                }else{
                    self.showScreen("HmSaleOrderManagementScreen");
                }
                const val = this.formatCurrentOrder(payload, quotation_number);
                try {
                    this.rpc({
                        model: 'pos.quotation',
                        method: 'create_quotation',
                        args: [val],
                        kwargs: {
                            context: this.env.session.user_context
                        },
                    }).then((result) => {
                        if (result) {
                            self.env.pos.quotation_number = result[1];

                            self.env.pos.db.add_quotations(result[0]);

                            self.currentOrder.destroy({'reason':'abandon'})
                            
                            returnOk = true;
                            
                        }
                    });
                } catch (error) {
                    this.showPopup('QuotationPopUpAlert', {
                        title: this.env._t('Error'),
                        body: this.env._t("Não foi possível acessar o servidor. Tente novamente mais tarde!"),
                    })
                    return;
                }

                if(returnOk){
                    this.showPopup('QuotationPopUpAlert', {
                        title: this.env._t('Sucesso'),
                        body: this.env._t(quotation_number + ' Criado com Sucesso!'),
                    })
                }
            }
        }

        formatCurrentOrder(payload, quotation_number) {
            const cashier = this.env.pos.get_cashier()
            const order = this.currentOrder.export_as_JSON();
            let val = {
                ref: quotation_number,
                amount_tax: order.amount_tax,
                amount_total: order.amount_total,
                fiscal_position_id: order.fiscal_position_id,
                partner_id: order.partner_id,
                pos_session_id: order.pos_session_id,
                user_id: order.user_id,
                pricelist_id: order.pricelist_id,
                lines: [],
                notes: payload,
            };
            order.lines.forEach((line) => {
                val['lines'].push([0, 0, {
                    product_id: line[2].product_id,
                    qty: line[2].qty,
                    price_unit: line[2].price_unit,
                    price_subtotal: line[2].price_subtotal,
                    price_subtotal_incl: line[2].price_subtotal_incl,
                    discount: line[2].discount,
                    tax_ids: line[2].tax_ids,
                    customer_note: line[2].customer_note
                }])
            })

            return val
        }
    }

    CreateQuotationButton.template = 'CreateQuotationButton';

    ProductScreen.addControlButton({
        component: CreateQuotationButton,
        condition: function() {
            return true;
        },
    });

    Registries.Component.add(CreateQuotationButton);

    return CreateQuotationButton;
});