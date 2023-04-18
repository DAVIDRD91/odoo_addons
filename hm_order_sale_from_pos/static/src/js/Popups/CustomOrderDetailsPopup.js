odoo.define('point_of_sale.CustomOrderDetailsPopup', function(require) {
    'use strict';

    const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    const { _lt } = require('@web/core/l10n/translation');

    // formerly CustomOrderDetailsPopupWidget
    class CustomOrderDetailsPopup extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({ hm_data_entrega: this.getDate() });
            this.inputRef = useRef('hm_data_entrega');
        }
        mounted() {
            this.inputRef.el.focus();
        }
        // getPayload() {
        //     return this.state.hm_data_entrega;
        // }
        getPayload(event) {
            var infos = {
                'hm_data_entrega': this.state.hm_data_entrega,
                };
            this.env.pos.get_order().add_custom_order_detail(infos);

            return infos
        }

        getDate(){
            return moment().format('YYYY-MM-DD');
        }
        
    }
    CustomOrderDetailsPopup.template = 'CustomOrderDetailsPopupWidget';
    CustomOrderDetailsPopup.defaultProps = {
        confirmText: _lt('Ok'),
        cancelText: _lt('Cancelar'),
        title: '',
        body: '',
    };

    Registries.Component.add(CustomOrderDetailsPopup);

    return CustomOrderDetailsPopup;
});
