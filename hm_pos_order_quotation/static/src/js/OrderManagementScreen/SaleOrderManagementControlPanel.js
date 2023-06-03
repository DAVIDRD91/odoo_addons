odoo.define('hm_pos_order_quotation.HmSaleOrderManagementControlPanel', function (require) {
    'use strict';

    const { useContext } = owl.hooks;
    const { useAutofocus, useListener } = require('web.custom_hooks');
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const HmSaleOrderFetcher = require('hm_pos_order_quotation.HmSaleOrderFetcher');
    const contexts = require('point_of_sale.PosContext');

    // NOTE: These are constants so that they are only instantiated once
    // and they can be used efficiently by the OrderManagementControlPanel.
    const VALID_SEARCH_TAGS = new Set(['data', 'cliente', 'id', 'nome']);
    const FIELD_MAP = {
        data: 'quotation_date',
        cliente: 'partner_id.display_name',
        nome: 'id',
        id: 'id',
    };
    const SEARCH_FIELDS = ['id', 'partner_id.display_name', 'quotation_date'];

    /**
     * @emits close-screen
     * @emits prev-page
     * @emits next-page
     * @emits search
     */
    class HmSaleOrderManagementControlPanel extends PosComponent {
        constructor() {
            super(...arguments);
            // We are using context because we want the `searchString` to be alive
            // even if this component is destroyed (unmounted).
            this.orderManagementContext = useContext(contexts.orderManagement);
            useListener('clear-search', this._onClearSearch);
            useAutofocus({ selector: 'input' });

            let currentClient = this.env.pos.get_client();
            if (currentClient) {
                this.orderManagementContext.searchString = currentClient.name;
                let domain = this._computeDomain();
                HmSaleOrderFetcher.setSearchDomain(domain);
            }
        }
        onInputKeydown(event) {
            if (event.key === 'Enter') {
                this.trigger('search', this._computeDomain());
            }
        }
        // get showPageControls() {
        //     return HmSaleOrderFetcher.lastPage > 1;
        // }
        // get pageNumber() {
        //     const currentPage = HmSaleOrderFetcher.currentPage;
        //     const lastPage = HmSaleOrderFetcher.lastPage;
        //     return isNaN(lastPage) ? '' : `(${currentPage}/${lastPage})`;
        // }
        get validSearchTags() {
            return VALID_SEARCH_TAGS;
        }
        get fieldMap() {
            return FIELD_MAP;
        }
        get searchFields() {
            return SEARCH_FIELDS;
        }
        /**
         * E.g. 1
         * ```
         *   searchString = 'Customer 1'
         *   result = [
         *      '|',
         *      '|',
         *      ['pos_reference', 'ilike', '%Customer 1%'],
         *      ['partner_id.display_name', 'ilike', '%Customer 1%'],
         *      ['date_order', 'ilike', '%Customer 1%']
         *   ]
         * ```
         *
         * E.g. 2
         * ```
         *   searchString = 'date: 2020-05'
         *   result = [
         *      ['date_order', 'ilike', '%2020-05%']
         *   ]
         * ```
         *
         * E.g. 3
         * ```
         *   searchString = 'customer: Steward, date: 2020-05-01'
         *   result = [
         *      ['partner_id.display_name', 'ilike', '%Steward%'],
         *      ['date_order', 'ilike', '%2020-05-01%']
         *   ]
         * ```
         */
        _computeDomain() {
            let domain = [['state', '=', 'draft']];
            const input = this.orderManagementContext.searchString.trim();
            if (!input) return domain;

            const searchConditions = this.orderManagementContext.searchString.split(/[,&]\s*/);
            if (searchConditions.length === 1) {
                let cond = searchConditions[0].split(/:\s*/);
                if (cond.length === 1) {
                  domain = domain.concat(Array(this.searchFields.length - 1).fill('|'));
                  domain = domain.concat(this.searchFields.map((field) => [field, 'ilike', `%${cond[0]}%`]));
                  return domain;
                }
            }

            for (let cond of searchConditions) {
                let [tag, value] = cond.split(/:\s*/);
                if (!this.validSearchTags.has(tag)) continue;
                domain.push([this.fieldMap[tag], 'ilike', `%${value}%`]);
            }
            return domain;
        }
        _onClearSearch() {
            this.orderManagementContext.searchString = '';
            this.onInputKeydown({ key: 'Enter' });
        }
    }
    HmSaleOrderManagementControlPanel.template = 'HmSaleOrderManagementControlPanel';

    Registries.Component.add(HmSaleOrderManagementControlPanel);

    return HmSaleOrderManagementControlPanel;
});
