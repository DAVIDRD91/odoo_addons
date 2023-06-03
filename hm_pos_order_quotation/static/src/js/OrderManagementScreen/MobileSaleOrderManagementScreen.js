odoo.define('hm_pos_order_quotation.HmMobileSaleOrderManagementScreen', function (require) {
    const HmSaleOrderManagementScreen = require('hm_pos_order_quotation.HmSaleOrderManagementScreen');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { useState } = owl.hooks;

    const HmMobileSaleOrderManagementScreen = (HmSaleOrderManagementScreen) => {
        class HmMobileSaleOrderManagementScreen extends HmSaleOrderManagementScreen {
            constructor() {
                super(...arguments);
                useListener('click-order', this._onShowDetails)
                this.mobileState = useState({ showDetails: false });
            }
            _onShowDetails() {
                this.mobileState.showDetails = true;
            }
        }
        HmMobileSaleOrderManagementScreen.template = 'HmMobileSaleOrderManagementScreen';
        return HmMobileSaleOrderManagementScreen;
    };

    Registries.Component.addByExtending(HmMobileSaleOrderManagementScreen, HmSaleOrderManagementScreen);

    return HmMobileSaleOrderManagementScreen;
});
