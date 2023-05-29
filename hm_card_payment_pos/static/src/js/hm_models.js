odoo.define('hm_card_payment_pos.models', function (require) {
    var models = require('point_of_sale.models');

    var _super_pos = models.PosModel.prototype;

    //Campos Personalizados
    models.load_fields('pos.payment.method',['hm_card_operators_ids']);
    models.load_fields('pos.payment',['hm_amount_card_fee']);

    //Modelos Personalizados
    _super_pos.models.push({
        model: 'hm.card.operators',
        label: 'load_card_operators',
        fields: ['sequence','name','type','transaction_fee','portion_transaction_fee'],
        loaded: function(self, list_card_operators) {
            self.list_card_operators = list_card_operators;
        },
    });

    models.PosModel = models.PosModel.extend({
        initialize: function(attributes, options) {
            _super_pos.initialize.apply(this, arguments);

            
        },

        getCardOperatorsById: function(id) {
            return this.getCardOperators([id])
        },

        getCardOperatorsByIds(listaIDs) {
            var objCardOperators = this.list_card_operators;

            var listaFiltrada = objCardOperators.filter(function(obj) {
                return listaIDs.includes(obj.id);
            });

            return listaFiltrada;
        }
    });

    var _super_paymentline = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function (attributes, options) {
            _super_paymentline.initialize.apply(this, arguments);
            this.hm_amount_card_fee = 0;
            this.hm_card_operators_select = null;
        },
        init_from_JSON: function (json) {
            _super_paymentline.init_from_JSON.apply(this, arguments);
            this.hm_amount_card_fee = json.hm_amount_card_fee;
            this.hm_card_operators_select = json.hm_card_operators_select;
        },
        export_as_JSON: function () {
            return _.extend(_super_paymentline.export_as_JSON.apply(this, arguments), {
                hm_amount_card_fee: this.hm_amount_card_fee,
                hm_card_operators_select: this.hm_card_operators_select,
            });
        },
    });


    var _super_pos_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(attributes, options) {
            _super_pos_order.initialize.apply(this, arguments);
            return this;
        },

    });

});