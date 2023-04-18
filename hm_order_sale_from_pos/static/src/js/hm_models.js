odoo.define('hm_pos_customer_detail.models', function (require) {
"use strict";

    var models = require('point_of_sale.models');
    var hm_order_super = models.Order.prototype;
    models.load_fields('pos.order',['hm_data_entrega']);

    models.Order = models.Order.extend({
        init_from_JSON: function (json) {
            hm_order_super.init_from_JSON.apply(this, arguments);
            this.hm_data_entrega = json.hm_data_entrega;
        },
        export_as_JSON: function () {
            return _.extend(hm_order_super.export_as_JSON.apply(this, arguments), {
                hm_data_entrega: this.hm_data_entrega,
            });
        },
        add_custom_order_detail: function(infos) {
            this.assert_editable();
            this.hm_data_entrega = infos.hm_data_entrega;
        },
        get_hm_data_entrega: function() {
            var dataEntrega = moment().format('DD/MM/YYYY');
            if(this.hm_data_entrega){
                dataEntrega = moment(this.hm_data_entrega).format('DD/MM/YYYY');
            }
            return dataEntrega;
        },
        export_for_printing: function() {
        var json = hm_order_super.export_for_printing.apply(this,arguments);
        json.hm_data_entrega = moment(this.hm_data_entrega).format('DD/MM/YYYY');
        return json;
    },

    });
    return models;
});