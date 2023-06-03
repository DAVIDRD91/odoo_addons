odoo.define('hm_pos_order_quotation.HmSaleOrderList', function (require) {
    'use strict';

    const { useState } = owl.hooks;
    const { useListener } = require('web.custom_hooks');
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    /**
     * @props {models.Order} [initHighlightedOrder] initially highligted order
     * @props {Array<models.Order>} orders
     */
    class HmSaleOrderList extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click-order', this._onClickOrder);
            this.state = useState({ highlightedOrder: this.props.initHighlightedOrder || null });
        }
        get highlightedOrder() {
            return this.state.highlightedOrder;
        }
        _onClickOrder({ detail: order }) {
            this.state.highlightedOrder = order;
        }
    }
    HmSaleOrderList.template = 'HmSaleOrderList';

    Registries.Component.add(HmSaleOrderList);

    return HmSaleOrderList;
});
