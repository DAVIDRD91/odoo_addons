# © 2023 David Rodrigues, Hasmany

# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class AccountPaymentRegister(models.TransientModel):
    _inherit = 'account.payment.register'

    hm_operator_id = fields.Many2one('hm.card.operators', string='operators')

    hm_hide_operator_id = fields.Boolean(
        compute='_compute_hm_hide_operator_id',
        help="Technical field used to hide the payment method if the selected journal has only one available which is 'manual'")


    @api.onchange("journal_id")
    def _onchange_hm_operator_ids(self):
        hm_operator_ids = []
        if self.journal_id:
            hm_operator_ids = self.journal_id.hm_card_operators_ids.ids
            return {"domain": {"hm_operator_id": [("id", "in", hm_operator_ids)]}}
        
    @api.depends('journal_id')
    def _compute_hm_hide_operator_id(self):
        hm_operator_ids = self.journal_id.hm_card_operators_ids.ids

        if len(hm_operator_ids) > 0:
            self.hm_hide_operator_id = False
        else:
            self.hm_hide_operator_id = True