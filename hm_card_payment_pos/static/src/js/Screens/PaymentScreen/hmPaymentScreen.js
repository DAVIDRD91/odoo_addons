odoo.define('hm_card_payment_pos.HmPaymentScreen', function(require) {
    'use strict';

    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const Registries = require('point_of_sale.Registries');
    var utils = require('web.utils');

    var round_di = utils.round_decimals;

    const HmPaymentScreen = PaymentScreen =>
        class extends PaymentScreen {
            
            /**
             * @override
             */
            async addNewPaymentLine({ detail: paymentMethod }) {
                //Chama a função addNewPaymentLine original
                super.addNewPaymentLine({ detail: paymentMethod });

                var idsCardOperators = paymentMethod.hm_card_operators_ids;

                var listObjCardOperators = this.env.pos.getCardOperatorsByIds(idsCardOperators);

                if(listObjCardOperators.length > 0 ){

                    const { confirmed, payload } = await this.showPopup('SelectCardFlagPopupWidget', {
                        array: listObjCardOperators,
                    });

                    if(confirmed){
                        
                        this.selectedPaymentLine.hm_card_operators_select = payload.selectCard
                    }

                }
                //Execução apos adicionar nova linha de pagamento
                this.calc_amount_card_fee();
            }

            /**
             * @override
             */
            async _updateSelectedPaymentline({ detail: paymentMethod }) {

                //Chama a função _updateSelectedPaymentline original
                super._updateSelectedPaymentline({ detail: paymentMethod });

                //Execução apos atualizar linha de pagamento
                this.calc_amount_card_fee();
            
            }

            calc_amount_card_fee() {
                
                var hm_card_operators_select = this.selectedPaymentLine.hm_card_operators_select;
                
                if(hm_card_operators_select !== null){
                    var transaction_fee = hm_card_operators_select.transaction_fee;
                    var amount = this.selectedPaymentLine.amount;
                    var hm_amount_card_fee = (amount * (transaction_fee / 100)); 
                    this.selectedPaymentLine.hm_amount_card_fee = round_di(parseFloat(hm_amount_card_fee) || 0, 2);
                    this.hm_amount_card_fee = this.selectedPaymentLine.hm_amount_card_fee
                }
                return null
            }
        };

    Registries.Component.extend(PaymentScreen, HmPaymentScreen);

    return PaymentScreen;
});
