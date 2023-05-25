# © 2023 David Rodrigues, HasMany Sistemas

### -*- coding: utf-8 -*-
from odoo import models,fields,api

class PosOrder(models.Model):
    _inherit = "pos.order"

    @api.model
    
    def _payment_fields(self, order, ui_paymentline):
        payment_fields = super(PosOrder, self)._payment_fields(order, ui_paymentline)
        payment_fields['hm_amount_card_fee'] = ui_paymentline.get('hm_amount_card_fee')
        return payment_fields
        
