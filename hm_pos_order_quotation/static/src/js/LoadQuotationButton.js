odoo.define('hm_pos_order_quotation.LoadQuotationButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const { isConnectionError } = require('point_of_sale.utils');

    class LoadQuotationButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        mounted() {
            this.env.pos.get('orders').on('add remove change', () => this.render(), this);
            this.env.pos.on('change:selectedOrder', () => this.render(), this);
        }
        willUnmount() {
            this.env.pos.get('orders').off('add remove change', null, this);
            this.env.pos.off('change:selectedOrder', null, this);
        }
        get currentOrder() {
            return this.env.pos.get_order();
        }
        async onClick() {
          try {
              // ping the server, if no error, show the screen
              await this.rpc({
                  model: 'pos.quotation',
                  method: 'browse',
                  args: [[]],
                  kwargs: { context: this.env.session.user_context },
              });
              this.trigger('close-popup');
              this.showScreen('HmSaleOrderManagementScreen');
          } catch (error) {
              if (isConnectionError(error)) {
                  this.showPopup('ErrorPopup', {
                      title: this.env._t('Network Error'),
                      body: this.env._t('Cannot access order management screen if offline.'),
                  });
              } else {
                  throw error;
              }
          }
        }
    }

    LoadQuotationButton.template = 'LoadQuotationButton';

    ProductScreen.addControlButton({
        component: LoadQuotationButton,
        condition: function() {
            return true;
        },
    });

    Registries.Component.add(LoadQuotationButton);

    return LoadQuotationButton;
});


// odoo.define("pos_order_quotation.LoadQuotationButton", function(require) {
//     "use strict";

//     const PosComponent = require('point_of_sale.PosComponent');
//     const ProductScreen = require('point_of_sale.ProductScreen');
//     const {
//         useListener
//     } = require('web.custom_hooks');
//     const Registries = require('point_of_sale.Registries');
//     var pos_model = require('point_of_sale.models');

//     class LoadQuotationButton extends PosComponent {

//         constructor() {
//             super(...arguments);
//             useListener('click', this.onClick);
//         }

//         async onClick() {
//             var self = this;

//             const {
//                 confirmed,
//                 payload: selectedQuotation
//             } = await this.showPopup(
//                 'LoadQuotationPopup', {
//                     title: this.env._t('Selecionar Cotação'),
//                     confirmText: this.env._t('Carregar'),
//                     cancelText: this.env._t('Cancelar'),
//                 }
//             );

//             if (confirmed) {
//                 var error = false;
//                 var self = this;
//                 self.rpc({
//                     model: 'pos.quotation',
//                     method: 'get_quotation_details',
//                     args: [selectedQuotation.id],
//                 }).catch(function(unused, event) {
//                     self.showPopup('QuotationPopUpAlert', {
//                         title: self.env._t('Error'),
//                         body: self.env._t("Erro de conexão, Tente mais tarde!"),
//                     })
//                     error = true;
//                     return;
//                 }).then(async function(quotation) {
//                     if (quotation) {
//                         if (!error) {
//                             self.env.pos.add_new_order();
//                             let new_order = self.env.pos.get_order();
//                             let client = self.env.pos.db.get_partner_by_id(quotation.partner_id)
//                             if (quotation.partner_id && !client) {
//                                 await self.env.pos.load_new_partners();
//                                 client = self.env.pos.db.get_partner_by_id(quotation.partner_id);
//                             }
//                             new_order.set_client(client);
//                             quotation.lines.forEach(function(line) {
//                                 var orderline = new pos_model.Orderline({}, {
//                                     pos: self.env.pos,
//                                     order: new_order,
//                                     product: self.env.pos.db.get_product_by_id(line.product_id),
//                                 });
//                                 orderline.set_unit_price(line.price_unit);
//                                 orderline.set_discount(line.discount);
//                                 orderline.set_quantity(line.qty, true);
//                                 new_order.add_orderline(orderline);
//                             });
//                             let quotation_tags = {};
//                             new_order.quotation_id = quotation.id;
//                             new_order.quotation_name = quotation.ref;
//                             new_order.seller_id = quotation.seller_id;
//                             new_order.fiscal_position_id = quotation.fiscal_position_id;
//                             new_order.export_as_JSON()
//                             self.showPopup('QuotationPopUpAlert', {
//                                 title: self.env._t('Sucesso!'),
//                                 body: self.env._t(quotation.quotation_name + ' Carregado com Sucesso!'),
//                             })
//                         }
//                     }
//                 });
//             }
//         }

//         get currentOrder() {
//             return this.env.pos.get_order();
//         }
//     }

//     LoadQuotationButton.template = 'LoadQuotationButton';

//     ProductScreen.addControlButton({
//         component: LoadQuotationButton,
//         condition: function() {
//             return true;
//         },
//     });

//     Registries.Component.add(LoadQuotationButton);

//     return LoadQuotationButton;
// });