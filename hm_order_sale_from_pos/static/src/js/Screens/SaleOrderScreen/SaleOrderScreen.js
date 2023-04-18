odoo.define('pos_expenses_pay.SaleOrderScreen', function (require) {
    'use strict';

    const { useState } = owl.hooks;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const models = require('point_of_sale.models');

    class SaleOrderScreen extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('close-screen', this.back);
            useListener('click-sale-order', this._onClickSaleOrder);
            this.state = useState({
                orders: []
            });
        }
        async mounted(){
            super.mounted;
            this.state.orders = await this.orders();
        }
        back() {
            this.showScreen('ProductScreen');
        }
        get date() {
            return moment(this.order.date_order).format('YYYY-MM-DD hh:mm A');
        }

        async orders() {
            var result = Promise.resolve()
            result = await this.rpc({
                model: 'sale.order',
                method: 'search_read',
                kwargs: {
                    //domain: [['is_pos_created', '=', true]],
                    domain: [['state', '=', 'draft']],
                    fields: ['id', 'name', 'partner_id', 'date_order', 'state', 'amount_total', 'user_id','commitment_date',],
                }
            });
            return result;
        }

        async _onClickSaleOrder(event) {
            if (this.env.pos.get_order().get_orderlines().length > 0){
                while(this.env.pos.get_order().get_selected_orderline()) {
                    this.env.pos.get_order().remove_orderline(this.env.pos.get_order().get_selected_orderline())
                } 
            }
            const clickedOrder = event.detail;
            const { confirmed, payload: selectedOption } = await this.showPopup('SalesSelectionPopup',
                {
                    title: this.env._t('Pedido de venda')  + '  ' + clickedOrder.name,
                    list: [
                            {
                                id:1, 
                                label: this.env._t("Finalizar pedido de venda"), 
                                item: true,
                                icon: 'fa fa-check-circle',
                            }, 
                        // {
                        //     id:2, 
                        //     label: this.env._t("Cancelar pedido de venda"), 
                        //     item: false,
                        //     icon: 'fa fa-close',
                        // }
                    ],
                });
            if (confirmed){
                if(selectedOption){
                    if (clickedOrder.state !== 'sale') {
                        // var result = await this.rpc({
                        //     model: 'sale.order',
                        //     method: 'action_confirm',
                        //     args: [clickedOrder.id]
                        // });
                        let currentPOSOrder = this.env.pos.get_order();
                        let sale_order = await this._getSaleOrder(clickedOrder.id);

                        this.setSaleOrderInPos(sale_order);

                        try {
                            await this.env.pos.load_new_partners();
                        }
                        catch (error){
                        }
                        currentPOSOrder.set_client(this.env.pos.db.get_partner_by_id(sale_order.partner_id[0]));
                        let orderFiscalPos = sale_order.fiscal_position_id ? this.env.pos.fiscal_positions.find(
                            (position) => position.id === sale_order.fiscal_position_id[0]
                        )
                        : false;
                        if (orderFiscalPos){
                            currentPOSOrder.fiscal_position = orderFiscalPos;
                        }
                        let orderPricelist = sale_order.pricelist_id ? this.env.pos.pricelists.find(
                            (pricelist) => pricelist.id === sale_order.pricelist_id[0]
                        )
                        : false;
                        if (orderPricelist){
                            currentPOSOrder.set_pricelist(orderPricelist);
                        }
                        
                        // settle the order
                        let lines = sale_order.order_line;
                        let product_to_add_in_pos = lines.filter(line => !this.env.pos.db.get_product_by_id(line.product_id[0])).map(line => line.product_id[0]);
                        if (product_to_add_in_pos.length){
                            const { confirmed } = await this.showPopup('ConfirmPopup', {
                                title: this.env._t('Produtos não disponíveis no PDV'),
                                body:
                                    this.env._t(
                                        'Alguns dos produtos do seu Pedido de Venda não estão disponíveis no PDV, deseja importá-los?'
                                    ),
                                confirmText: this.env._t('Sim'),
                                cancelText: this.env._t('Não'),
                            });
                            if (confirmed){
                                await this.env.pos._addProducts(product_to_add_in_pos);
                            }
        
                        }
        
                        /**
                         * This variable will have 3 values, `undefined | false | true`.
                         * Initially, it is `undefined`. When looping thru each sale.order.line,
                         * when a line comes with lots (`.lot_names`), we use these lot names
                         * as the pack lot of the generated pos.order.line. We ask the user
                         * if he wants to use the lots that come with the sale.order.lines to
                         * be used on the corresponding pos.order.line only once. So, once the
                         * `useLoadedLots` becomes true, it will be true for the succeeding lines,
                         * and vice versa.
                         */
                        let useLoadedLots;
        
                        for (var i = 0; i < lines.length; i++) {
                            let line = lines[i];
                            if (!this.env.pos.db.get_product_by_id(line.product_id[0])){
                                continue;
                            }
                            
                            let new_line = new models.Orderline({}, {
                                pos: this.env.pos,
                                order: this.env.pos.get_order(),
                                product: this.env.pos.db.get_product_by_id(line.product_id[0]),
                                description: line.name,
                                price: line.price_unit,
                                tax_ids: orderFiscalPos ? undefined : line.tax_id,
                                price_manually_set: true,
                                sale_order_origin_id: clickedOrder,
                                sale_order_line_id: line,
                                customer_note: (line.customer_note ? line.customer_note : ''),
                            });
        
                            if (
                                new_line.get_product().tracking !== 'none' &&
                                (this.env.pos.picking_type.use_create_lots || this.env.pos.picking_type.use_existing_lots) &&
                                line.lot_names.length > 0
                            ) {
                                // Ask once when `useLoadedLots` is undefined, then reuse it's value on the succeeding lines.
                                const { confirmed } =
                                    useLoadedLots === undefined
                                        ? await this.showPopup('ConfirmPopup', {
                                                title: this.env._t('SN/Lots Loading'),
                                                body: this.env._t(
                                                    'Do you want to load the SN/Lots linked to the Sales Order?'
                                                ),
                                                confirmText: this.env._t('Yes'),
                                                cancelText: this.env._t('No'),
                                            })
                                        : { confirmed: useLoadedLots };
                                useLoadedLots = confirmed;
                                if (useLoadedLots) {
                                    new_line.setPackLotLines({
                                        modifiedPackLotLines: [],
                                        newPackLotLines: (line.lot_names || []).map((name) => ({ lot_name: name })),
                                    });
                                }
                            }
                            new_line.setQuantityFromSOL(line);
                            new_line.set_unit_price(line.price_unit);
                            new_line.set_discount(line.discount);
                            this.env.pos.get_order().add_orderline(new_line);
                        }

                        currentPOSOrder.trigger('change');
                        this.back();
                        
                    }
                    else {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Já confirmado'),
                            body: this.env._t(
                                'Este pedido de venda já está em estado confirmado!!!!'
                            ),
                        });
                    }
                }
                if (!selectedOption){
                    if (clickedOrder.state == 'done') {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Problema ao Cancelar'),
                            body: this.env._t(
                                'Para cancelar pedido de venda Trancado acesse o modulo Vendas!!!!'
                            ),
                        });
                    }
                    else if (clickedOrder.state !== 'cancel') {
                        var result = await this.rpc({
                            model: 'sale.order',
                            method: 'action_cancel',
                            args: [clickedOrder.id]
                        });
                    }
                    else {
                        await this.showPopup('ConfirmPopup', {
                            title: this.env._t('Já cancelado'),
                            body: this.env._t(
                                'Este pedido de venda já está em estado de cancelamento!!!!'
                            ),
                        });
                    }
                }
            }
        }

        //Provissorio para teste
        async setSaleOrderInPos(sale_order){
            if(!sale_order.commitment_date){
                //Se não tiver definido coloca 15 dias como padrão
                sale_order.commitment_date = moment().add(15, 'days').format('YYYY-MM-DD HH:mm:ss')
            }
            //Seta data de entrega no pos
            var infos = {
                'hm_data_entrega': sale_order.commitment_date,
            };
            
            this.env.pos.get_order().add_custom_order_detail(infos);

            this.env.pos.get_order().saleOrder = sale_order;
        }

        async _getSaleOrder(id) {
            let sale_order = await this.rpc({
                model: 'sale.order',
                method: 'read',
                args: [[id],['order_line', 'partner_id', 'pricelist_id', 'fiscal_position_id', 'amount_total', 'amount_untaxed','commitment_date']],
                context: this.env.session.user_context,
              });

            let sale_lines = await this._getSOLines(sale_order[0].order_line);
            sale_order[0].order_line = sale_lines;

            return sale_order[0];
        }

        async _getSOLines(ids) {
            let so_lines = await this.rpc({
                model: 'sale.order.line',
                method: 'hm_read_converted',
                args: [ids],
                context: this.env.session.user_context,
            });

            return so_lines;
        }
    }
    SaleOrderScreen.template = 'SaleOrderScreenWidget';
    SaleOrderScreen.defaultProps = {
    };

    Registries.Component.add(SaleOrderScreen);

    return SaleOrderScreen;
});