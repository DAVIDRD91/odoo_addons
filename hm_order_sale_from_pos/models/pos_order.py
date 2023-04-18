# -*- coding: utf-8 -*-
from odoo import models,fields,api

class PosOrder(models.Model):
    _inherit = "pos.order"

    hm_data_entrega = fields.Datetime(string='Data da Entrega',required=False)

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        res.update({
            'hm_data_entrega': ui_order['hm_data_entrega'] if ui_order.get('hm_data_entrega') else None,

        })
        return res


# class PosConfig(models.Model):
#     _inherit = "pos.config"

#     ni_enable_customer = fields.Boolean(string="Enable Contact for order?")