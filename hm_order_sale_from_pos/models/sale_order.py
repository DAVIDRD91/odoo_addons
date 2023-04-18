from odoo import _, api, fields, models
import datetime
import logging

_logger = logging.getLogger(__name__)

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    is_pos_created = fields.Boolean(string='Create from POS')


    @api.model
    def craete_saleorder_from_pos(self, oderdetails):
        vals = {}
        product_lines = oderdetails.get('product_lines')

        saleorder_id = self.env['sale.order'].create({
            'partner_id': oderdetails.get('partner_id'),
            'date_order': datetime.date.today(),
            'is_pos_created': True,
            'state': 'draft',
            'amount_tax': oderdetails.get('tax_amount'),
            'commitment_date': oderdetails.get('commitment_date'),
            'validity_date' : oderdetails.get('commitment_date'),
        })

        vals['name'] = saleorder_id.name
        vals['id'] = saleorder_id.id

        for data in product_lines:
            if not data == 'partner_id':
                current_dict = product_lines[data]
                saleorder_id.order_line = [(0, 0, {
                    'product_id': current_dict.get('product'),
                    'product_uom_qty':  current_dict.get('quantity'),
                    'price_unit': current_dict.get('price'),
                    'discount': current_dict.get('discount'),
                    'customer_note': current_dict.get('customerNote'),
                })]
            
        return vals