odoo.define('hm_pos_order_quotation.HmSaleOrderManagementScreen', function (require) {
    'use strict';

    const { useContext } = owl.hooks;
    const { useListener } = require('web.custom_hooks');
    const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
    const Registries = require('point_of_sale.Registries');
    const HmSaleOrderFetcher = require('hm_pos_order_quotation.HmSaleOrderFetcher');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const contexts = require('point_of_sale.PosContext');
    const models = require('point_of_sale.models');


    class HmSaleOrderManagementScreen extends ControlButtonsMixin(IndependentToOrderScreen) {
        constructor() {
            super(...arguments);
            useListener('close-screen', this.close);
            useListener('click-sale-order', this._onClickSaleOrder);
            useListener('search', this._onSearch);

            HmSaleOrderFetcher.setComponent(this);
            this.orderManagementContext = useContext(contexts.orderManagement);
        }
        mounted() {
            HmSaleOrderFetcher.on('update', this, this.render);
            this.env.pos.get('orders').on('add remove', this.render, this);

            // Fetch the order after mounting so that order management screen
            // is shown while fetching.
            setTimeout(() => HmSaleOrderFetcher.fetch(), 0);
        }
        willUnmount() {
            HmSaleOrderFetcher.off('update', this);
            this.env.pos.get('orders').off('add remove', null, this);
        }
        get selectedClient() {
            const order = this.orderManagementContext.selectedOrder;
            return order ? order.get_client() : null;
        }
        get orders() {
            var arrayOrders = HmSaleOrderFetcher.get();
            //Define ordem decrescente
            arrayOrders.sort((a, b) => b.id - a.id);
            return arrayOrders;
        }
        _onSearch({ detail: domain }) {
            HmSaleOrderFetcher.setSearchDomain(domain);
            HmSaleOrderFetcher.fetch();
        }
        
        updateOrdersScreen() {
            HmSaleOrderFetcher.setSearchDomain([['state', '=', 'draft']]);
            HmSaleOrderFetcher.fetch();
        }
        async _onClickSaleOrder(event) {
            const selectedQuotation = event.detail;
            const { confirmed, payload: selectedOption } = await this.showPopup('SelectionPopup',
                {
                    title: this.env._t('O que você quer fazer?'),
                    list: [{id:"1", label: this.env._t("Finalizar Pedido"), item: true}, {id:"2", label: this.env._t("Cancelar Pedido"), item: false}],
                });

            if (confirmed) {
                var error = false;
                var self = this;

                if (selectedOption && selectedQuotation.state == 'draft'){
                    self.rpc({
                        model: 'pos.quotation',
                        method: 'get_quotation_details',
                        args: [selectedQuotation.id],
                    }).catch(function(unused, event) {
                        self.showPopup('QuotationPopUpAlert', {
                            title: self.env._t('Erro'),
                            body: self.env._t("Erro de conexão, Tente mais tarde!"),
                        })
                        error = true;
                        return;
                    }).then(async function(quotation) {
                        if (quotation) {
                            if (!error) {
                                // self.env.pos.add_new_order();
                                let new_order = self.env.pos.get_order();
                                //Valida se a ordem esta vazia
                                if(new_order.get_orderlines().length > 0){
                                    self.env.pos.add_new_order();
                                    new_order = self.env.pos.get_order();
                                }
                                let client = self.env.pos.db.get_partner_by_id(quotation.partner_id)
                                if (quotation.partner_id && !client) {
                                    await self.env.pos.load_new_partners();
                                    client = self.env.pos.db.get_partner_by_id(quotation.partner_id);
                                }

                                new_order.set_client(client);
                                quotation.lines.forEach(function(line) {
                                    var orderline = new models.Orderline({}, {
                                        pos: self.env.pos,
                                        order: new_order,
                                        product: self.env.pos.db.get_product_by_id(line.product_id),
                                    });
                                    orderline.set_unit_price(line.price_unit);
                                    orderline.set_discount(line.discount);
                                    orderline.set_quantity(line.qty, true);
                                    orderline.set_customer_note(line.customer_note)
                                    new_order.add_orderline(orderline);
                                });
                                
                                new_order.quotation_id = quotation.id;
                                new_order.quotation_name = quotation.ref;
                                new_order.seller_id = quotation.seller_id;
                                new_order.fiscal_position_id = quotation.fiscal_position_id;
                                new_order.export_as_JSON()
                                self.showPopup('QuotationPopUpAlert', {
                                    title: self.env._t('Sucesso!'),
                                    body: self.env._t(quotation.quotation_name + ' Carregado com Sucesso!'),
                                })

                                new_order.trigger('change');
                                self.close();
                            }
                        }
                    });
                }
                else {
                    var isCancel = false; 

                    if (selectedQuotation.state == 'draft') {
                        const { confirmed } = await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Cancelar Pedido'),
                            body: this.env._t(
                                'Realmente deseja cancelar o pedido?'
                            ),
                            confirmText: this.env._t('Sim'),
                            cancelText: this.env._t('Não'),
                        })

                        isCancel = confirmed
                    }

                    if ( isCancel ) {
                        var result = await this.rpc({
                            model: 'pos.quotation',
                            method: 'action_cancel',
                            args: [selectedQuotation.id]
                        });

                        if(result){
                            this.showPopup('ConfirmPopup', {
                                title: this.env._t('Sucesso!!!'),
                                body: this.env._t(
                                    'Cancelado com Sucesso!!!!'
                                ),
                            });
                        }

                        self.updateOrdersScreen();
                    }
                    else if (selectedQuotation.state == 'loaded') {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Atenção'),
                            body: this.env._t(
                                'Este pedido já foi finalizado!!!!'
                            ),
                        });
                    }
                    else if (selectedQuotation.state == 'cancel') {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Atenção'),
                            body: this.env._t(
                                'Este pedido já foi cancelado!!!!'
                            ),
                        });
                    }
                    
                    
                }
            }
        }
    }
    HmSaleOrderManagementScreen.template = 'HmSaleOrderManagementScreen';
    HmSaleOrderManagementScreen.hideOrderSelector = true;

    Registries.Component.add(HmSaleOrderManagementScreen);

    return HmSaleOrderManagementScreen;
});
