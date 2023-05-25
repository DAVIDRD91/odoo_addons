odoo.define('hm_card_payment_pos.SelectCardFlagPopupWidget', function(require) {
    'use strict';

    //const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    //const { _lt } = require('@web/core/l10n/translation');

    // formerly SelectCardFlagPopupWidget
    class SelectCardFlagPopupWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.selectCard = null;
        }

        getPayload() {
            return {
                selectCard: this.selectCard,
            };
        }

        confirma(selectCard){
            this.selectCard = selectCard;
            
            this.confirm()
        }
        
    }
    SelectCardFlagPopupWidget.template = 'SelectCardFlagPopupWidget';
    SelectCardFlagPopupWidget.defaultProps = {
        title: 'Selecione a Bandeira',
        array: ['Mater 1','Visa2','Mater3'],
    };

    Registries.Component.add(SelectCardFlagPopupWidget);

    return SelectCardFlagPopupWidget;
});
