# © 2023 David Rodrigues, HasMany Sistemas

from odoo import api,fields, models


class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    hm_has_transaction_fee = fields.Boolean(
        string='Calcula tarifa de transação?',
        related='journal_id.hm_has_transaction_fee',
        readonly=True,
        store=True,
    )
    hm_fee_account_id = fields.Many2one(
        'account.account',
        string="Conta Tarifa de transação",
        help='Conta onde será registrado Tarifa de transação',
        related='journal_id.hm_fee_account_id', 
        readonly=True,
        store=True,
    )
    hm_card_operators_ids = fields.Many2many(
        'hm.card.operators',
        string='Operadores de Cartão',
        compute='_compute_hm_card_operators_ids',
        readonly=True,
        store=True,
    )

    @api.depends('journal_id.hm_card_operators_ids')
    def _compute_hm_card_operators_ids(self):
        for method in self:
            method.hm_card_operators_ids = method.journal_id.hm_card_operators_ids

    