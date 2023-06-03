odoo.define('hm_pos_order_quotation.HmSaleOrderRow', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    /**
     * @props {models.Order} order
     * @props columns
     * @emits click-order
     */
    class HmSaleOrderRow extends PosComponent {
        get order() {
            return this.props.order;
        }
        get highlighted() {
            const highlightedOrder = this.props.highlightedOrder;
            return !highlightedOrder ? false : highlightedOrder.backendId === this.props.order.backendId;
        }

        // Column getters //

        get name() {
            return this.order.id;
        }
        get date() {
            return moment(this.order.quotation_date).format('DD-MM-YYYY');
        }
        get customer() {
            const customer = this.order.partner_id;
            return customer ? customer[1] : null;
        }
        get total() {
            return this.env.pos.format_currency(this.order.amount_total);
        }
        get state() {
            let state_mapping = {
              'draft': this.env._t('Orçamento'),
              'loaded': this.env._t('Finalizado'),
              'cancel': this.env._t('Cancelado'),
            };

            return state_mapping[this.order.state];
        }
        get salesman() {
            const salesman = this.order.user_id;
            return salesman ? salesman[1] : null;
        }
    }
    HmSaleOrderRow.template = 'HmSaleOrderRow';

    Registries.Component.add(HmSaleOrderRow);

    return HmSaleOrderRow;
});
