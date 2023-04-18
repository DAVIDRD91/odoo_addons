odoo.define('wt_create_so_from_pos.SaleOrderButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');

    class SaleOrderButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }

        async funClearOrder(order){

            order.destroy({'reason':'abandon'})

        }

        async onClick() {
            var self = this;
            const oderdetails = {};
            oderdetails['product_lines']={};
            
            if (this.env.pos.get_client()){
                if (this.env.pos.get_order().get_orderlines().length > 0){
                    this.env.pos.get_order().get_orderlines().forEach(function(orderLine) {
                        oderdetails.product_lines[orderLine.id] = { 
                            product: orderLine.get_product().id, 
                            quantity: orderLine.quantity,
                            price: orderLine.price,
                            discount: orderLine.discount,
                            customerNote: orderLine.customerNote,
                        };
                    });
                    if (this.env.pos.get_order().get_total_tax() > 0){
                        oderdetails['tax_amount'] = this.env.pos.get_order().get_total_tax()
                    }else{
                        oderdetails['tax_amount'] = ''
                    }
                    
                    //Detalhes do Pedido de venda
                    const { confirmed } = await this.showPopup('CustomOrderDetailsPopup', {
                        title : this.env._t("Detalhes Do Pedido"),
                    });
                    
                    //Se detalhes do pedido for confirmado
                    if(confirmed){
                        oderdetails['commitment_date'] = this.env.pos.get_order().hm_data_entrega;

                        oderdetails['partner_id'] = this.env.pos.get_client().id;

                        const result = await this.rpc({
                            model: 'sale.order',
                            method: 'craete_saleorder_from_pos',
                            args: [oderdetails],
                        });

                        console.log('resultado ',result)

                        if(result){
                            
                            //Limpa a tela do pos
                            //await this.env.pos.get_order().destroy();
                            await this.funClearOrder(this.env.pos.get_order())

                            await this.showPopup('ConfirmPopup', {
                                title: this.env._t('Sucesso!!!'),
                                body: this.env._t(
                                    'Pedido de venda ' + result.name +' Criado com sucesso!!!!'
                                ),
                            });
                            
                            //Chama SaleOrderScreen para destravar tela
                            this.showScreen('SaleOrderScreen');

                        }
                    }

                }
                else if(this.env.pos.get_order().get_orderlines().length <= 0){
                    await this.showPopup('ErrorPopup', {
                        title: this.env._t('Sem Produto'),
                        body: this.env._t("Não há Produto para o pedido de venda."),
                    });
                }
            }
            else{
                await this.showPopup('ErrorPopup', {
                    title: this.env._t('Sem Cliente'),
                    body: this.env._t("Selecione um Cliente."),
                });
            }
            
        }
    }
    SaleOrderButton.template = 'SaleOrderButton';

    ProductScreen.addControlButton({
        component: SaleOrderButton,
        condition: function() {
            return this.env.pos.config.create_so;
        },
    });

    Registries.Component.add(SaleOrderButton);

    return SaleOrderButton;
});