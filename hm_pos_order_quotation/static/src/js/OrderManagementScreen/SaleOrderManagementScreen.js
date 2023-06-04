odoo.define('hm_pos_order_quotation.HmSaleOrderManagementScreen', function (require) {
    'use strict';

    const { sprintf } = require('web.utils');
    const { parse } = require('web.field_utils');
    const { useContext } = owl.hooks;
    const { useListener } = require('web.custom_hooks');
    const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
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
            useListener('next-page', this._onNextPage);
            useListener('prev-page', this._onPrevPage);
            useListener('search', this._onSearch);

            HmSaleOrderFetcher.setComponent(this);
            this.orderManagementContext = useContext(contexts.orderManagement);
        }
        mounted() {
            HmSaleOrderFetcher.on('update', this, this.render);
            this.env.pos.get('orders').on('add remove', this.render, this);

            //----------------------DELETE--------------------------------------
            // // calculate how many can fit in the screen.
            // // It is based on the height of the header element.
            // // So the result is only accurate if each row is just single line.
            // const flexContainer = this.el.querySelector('.flex-container');
            // const cpEl = this.el.querySelector('.control-panel');
            // const headerEl = this.el.querySelector('.header-row');
            // const val = Math.trunc(
            //     (flexContainer.offsetHeight - cpEl.offsetHeight - headerEl.offsetHeight) /
            //         headerEl.offsetHeight
            // );
            // HmSaleOrderFetcher.setNPerPage(val);
            //------------------------------------------------------------

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
            return HmSaleOrderFetcher.get();
        }
        async _setNumpadMode(event) {
            const { mode } = event.detail;
            this.numpadMode = mode;
            NumberBuffer.reset();
        }
        _onNextPage() {
            // HmSaleOrderFetcher.nextPage();
        }
        _onPrevPage() {
            // HmSaleOrderFetcher.prevPage();
        }
        _onSearch({ detail: domain }) {
            HmSaleOrderFetcher.setSearchDomain(domain);
            HmSaleOrderFetcher.setPage(1);
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
                    else {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Atenção'),
                            body: this.env._t(
                                'Este pedido já foi cancelado!!!!'
                            ),
                        });
                    }
                    
                    
                }
            }

            // if(confirmed){
            //     let currentPOSOrder = this.env.pos.get_order();
            //     let sale_order = await this._getSaleOrder(clickedOrder.id);
            //     try {
            //         await this.env.pos.load_new_partners();
            //     }
            //         catch (error){
            //     }

            //   currentPOSOrder.set_client(this.env.pos.db.get_partner_by_id(sale_order.partner_id[0]));
            // //   let orderFiscalPos = sale_order.fiscal_position_id ? this.env.pos.fiscal_positions.find(
            // //       (position) => position.id === sale_order.fiscal_position_id[0]
            // //   )
            // //   : false;
            // //   if (orderFiscalPos){
            // //       currentPOSOrder.fiscal_position = orderFiscalPos;
            // //   }
            // //   let orderPricelist = sale_order.pricelist_id ? this.env.pos.pricelists.find(
            // //       (pricelist) => pricelist.id === sale_order.pricelist_id[0]
            // //   )
            // //   : false;
            // //   if (orderPricelist){
            // //       currentPOSOrder.set_pricelist(orderPricelist);
            // //   }

            //     if (selectedOption = 1){
            //         // settle the order
            //         let lines = sale_order.order_line;
            //         let product_to_add_in_pos = lines.filter(line => !this.env.pos.db.get_product_by_id(line.product_id[0])).map(line => line.product_id[0]);
            //         if (product_to_add_in_pos.length){
            //             const { confirmed } = await this.showPopup('ConfirmPopup', {
            //                 title: this.env._t('Produtos não disponíveis no PDV'),
            //                 body:
            //                     this.env._t(
            //                         'Alguns dos produtos em seu pedido de venda não estão disponíveis no PDV, você deseja importá-los?'
            //                     ),
            //                 confirmText: this.env._t('Sim'),
            //                 cancelText: this.env._t('Não'),
            //             });
            //             if (confirmed){
            //                 await this.env.pos._addProducts(product_to_add_in_pos);
            //             }

            //         }

            //         /**
            //          * This variable will have 3 values, `undefined | false | true`.
            //          * Initially, it is `undefined`. When looping thru each sale.order.line,
            //          * when a line comes with lots (`.lot_names`), we use these lot names
            //          * as the pack lot of the generated pos.order.line. We ask the user
            //          * if he wants to use the lots that come with the sale.order.lines to
            //          * be used on the corresponding pos.order.line only once. So, once the
            //          * `useLoadedLots` becomes true, it will be true for the succeeding lines,
            //          * and vice versa.
            //          */
            //         let useLoadedLots;

            //         for (var i = 0; i < lines.length; i++) {
            //             let line = lines[i];
            //             if (!this.env.pos.db.get_product_by_id(line.product_id[0])){
            //                 continue;
            //             }

            //             let new_line = new models.Orderline({}, {
            //                 pos: this.env.pos,
            //                 order: this.env.pos.get_order(),
            //                 product: this.env.pos.db.get_product_by_id(line.product_id[0]),
            //                 description: line.name,
            //                 price: line.price_unit,
            //                 tax_ids: orderFiscalPos ? undefined : line.tax_id,
            //                 price_manually_set: true,
            //                 sale_order_origin_id: clickedOrder,
            //                 sale_order_line_id: line,
            //                 customer_note: line.customer_note,
            //             });

            //             if (
            //                 new_line.get_product().tracking !== 'none' &&
            //                 (this.env.pos.picking_type.use_create_lots || this.env.pos.picking_type.use_existing_lots) &&
            //                 line.lot_names.length > 0
            //             ) {
            //                 // Ask once when `useLoadedLots` is undefined, then reuse it's value on the succeeding lines.
            //                 const { confirmed } =
            //                     useLoadedLots === undefined
            //                         ? await this.showPopup('ConfirmPopup', {
            //                             title: this.env._t('SN/Lots Loading'),
            //                             body: this.env._t(
            //                                 'Do you want to load the SN/Lots linked to the Sales Order?'
            //                             ),
            //                             confirmText: this.env._t('Yes'),
            //                             cancelText: this.env._t('No'),
            //                         })
            //                         : { confirmed: useLoadedLots };
            //                 useLoadedLots = confirmed;
            //                 if (useLoadedLots) {
            //                     new_line.setPackLotLines({
            //                         modifiedPackLotLines: [],
            //                         newPackLotLines: (line.lot_names || []).map((name) => ({ lot_name: name })),
            //                     });
            //                 }
            //             }
            //             new_line.setQuantityFromSOL(line);
            //             new_line.set_unit_price(line.price_unit);
            //             new_line.set_discount(line.discount);
            //             this.env.pos.get_order().add_orderline(new_line);
            //         }
            //     }
            //     else {

            //         await this.showPopup('ConfirmPopup', {
            //             title: this.env._t('Cancelar Pedido'),
            //             body: this.env._t(
            //                 'Realmente deseja cancelar o pedido?'
            //             ),
            //             confirmText: this.env._t('Sim'),
            //             cancelText: this.env._t('Não'),
            //         })
                    
            //     }

            //   currentPOSOrder.trigger('change');
            //   this.close();
            // }

        }

        async _getSaleOrder(id) {
            let sale_order = await this.rpc({
                model: 'pos.quotation',
                method: 'read',
                args: [[id],['lines', 'partner_id', 'pricelist_id', 'fiscal_position_id', 'amount_total', 'amount_tax']],
                context: this.env.session.user_context,
              });

            let sale_lines = await this._getSOLines(sale_order[0].order_line);
            sale_order[0].order_line = sale_lines;

            return sale_order[0];
        }

        async _getSOLines(ids) {
          let so_lines = await this.rpc({
              model: 'pos.quotation.line',
              method: 'read_converted',
              args: [ids],
              context: this.env.session.user_context,
          });
          return so_lines;
        }

    }
    HmSaleOrderManagementScreen.template = 'HmSaleOrderManagementScreen';
    HmSaleOrderManagementScreen.hideOrderSelector = true;

    Registries.Component.add(HmSaleOrderManagementScreen);

    return HmSaleOrderManagementScreen;
});
