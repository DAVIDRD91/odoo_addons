odoo.define('hm_pos_order_quotation.HmSaleOrderFetcher', function (require) {
    'use strict';

    const { EventBus } = owl.core;
    const { Gui } = require('point_of_sale.Gui');
    const { isConnectionError } = require('point_of_sale.utils');
    const models = require('point_of_sale.models');

    class HmSaleOrderFetcher extends EventBus {
        constructor() {
            super();
            this.currentPage = 1;
            this.ordersToShow = [];
            this.totalCount = 0;
            this.searchDomain = [
                // ['company_id', '=', self.env.pos.company.id],
                ['state', '=', 'draft']
            ]
        }


        /**
         * for nPerPage = 10
         * +--------+----------+
         * | nItems | lastPage |
         * +--------+----------+
         * |     2  |       1  |
         * |    10  |       1  |
         * |    11  |       2  |
         * |    30  |       3  |
         * |    35  |       4  |
         * +--------+----------+
         */
        get lastPage() {
            const nItems = this.totalCount;
            return Math.trunc(nItems / (this.nPerPage + 1)) + 1;
        }
        /**
         * Chamar esse métodos preenche o evento `orderShow`, então acionador` update`.
         * @Related Get
         *
         * Nota: Isso é fortemente acoplado à paginação.Então, se a página atual contiver tudo
         * Pedidos ativos, ele não buscará nada do servidor, mas apenas define `OrderShow`
         * Para os pedidos ativos que se encaixam na página atual.
         */
        async fetch() {
            try {
                // let limit, offset;
                // let start, end;
                // // Show orders from the backend.
                // offset =
                //     this.nPerPage +
                //     (this.currentPage - 1 - 1) *
                //         this.nPerPage;
                // limit = this.nPerPage;
                this.ordersToShow = await this._fetch();

                this.trigger('update');
            } catch (error) {
                if (isConnectionError(error)) {
                    Gui.showPopup('ErrorPopup', {
                        title: this.comp.env._t('Network Error'),
                        body: this.comp.env._t('Unable to fetch orders if offline.'),
                    });
                    Gui.setSyncStatus('error');
                } else {
                    throw error;
                }
            }
        }
        /**
         * This returns the orders from the backend that needs to be shown.
         * If the order is already in cache, the full information about that
         * order is not fetched anymore, instead, we use info from cache.
         *
         * @param {number} limit
         * @param {number} offset
         */
        async _fetch() {
            const sale_orders = await this._getOrderIdsForCurrentPage();

            this.totalCount = sale_orders.length;
            return sale_orders;
        }
        async _getOrderIdsForCurrentPage() {
            
            return await this.rpc({
                model: 'pos.quotation',
                method: 'search_read',
                args: [this.searchDomain ? this.searchDomain : [], 
                        ['name', 'partner_id', 'amount_total', 'quotation_date', 'state', 'user_id']
                    ],
            });
        }

        nextPage() {
            if (this.currentPage < this.lastPage) {
                this.currentPage += 1;
                this.fetch();
            }
        }
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.fetch();
            }
        }
        /**
         * @param {integer|undefined} id id of the cached order
         * @returns {Array<models.Order>}
         */
        get(id) {
            return this.ordersToShow;
        }
        setSearchDomain(searchDomain) {
            this.searchDomain = searchDomain;
        }
        setComponent(comp) {
            this.comp = comp;
            return this;
        }
        setNPerPage(val) {
            this.nPerPage = val;
        }
        setPage(page) {
            this.currentPage = page;
        }

        async rpc() {
            Gui.setSyncStatus('connecting');
            const result = await this.comp.rpc(...arguments);
            Gui.setSyncStatus('connected');
            return result;
        }
    }

    return new HmSaleOrderFetcher();
});
