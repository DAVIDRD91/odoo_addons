odoo.define('point_of_sale.HmPaymentScreenPaymentLines', function(require) {
    'use strict';

    const PaymentScreenPaymentLines = require('point_of_sale.PaymentScreenPaymentLines');
    const Registries = require('point_of_sale.Registries');

    const HmPaymentScreenPaymentLines = PaymentScreenPaymentLines =>
        class extends PaymentScreenPaymentLines {

            getNameCardOperatorsSelect(line) {
                if (line.hm_card_operators_select !== null) {
                    return line.hm_card_operators_select.name;
                }

                return '';
            }

        };

    Registries.Component.extend(PaymentScreenPaymentLines, HmPaymentScreenPaymentLines);
    
    return PaymentScreenPaymentLines;
});
