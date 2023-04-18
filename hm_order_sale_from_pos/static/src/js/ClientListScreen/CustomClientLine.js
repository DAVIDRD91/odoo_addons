odoo.define('hm_create_so_from_pos.HmCustomClientLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class HmCustomClientLine extends PosComponent {
        get highlight() {
            return this.props.partner !== this.props.selectedClient ? '' : 'highlight';
        }
    }
    HmCustomClientLine.template = 'HmCustomClientLine';

    Registries.Component.add(HmCustomClientLine);

    return HmCustomClientLine;
});
