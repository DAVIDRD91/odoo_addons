odoo.define('hm_card_payment_pos.DB', function(require) {
    "use strict";
    var db = require('point_of_sale.DB');

    db.include({
        init: function(options) {
            this._super.apply(this, arguments);
            this.list_card_operators = {}
        },
    });

    return db
});