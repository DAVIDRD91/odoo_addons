# © 2023 David Rodrigues, HasMany Sistemas

from odoo import fields, models


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    hm_has_transaction_fee = fields.Boolean(string="Tem tarifa de transação?")
    hm_transaction_fee = fields.Float(string="Valor da tarifa (%): ")
    hm_fee_account_id = fields.Many2one(
        comodel_name='account.account', check_company=True,
        help="Conta utilizada para registrar taxa de transações.",
        string='Conta Tarifa de transação',
        domain=lambda self: "[('deprecated', '=', False), ('company_id', '=', company_id), \
                             ('user_type_id.type', 'not in', ('receivable', 'payable')), \
                             ('user_type_id', '=', %s)]" % self.env.ref('account.data_account_type_expenses').id)


