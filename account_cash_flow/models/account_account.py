# © 2023 David Rodrigues, HasMany Sistemas

from odoo import fields, models


class AccountAccount(models.Model):
    _inherit = 'account.account'

    hm_fixed_cost = fields.Boolean(string="É custo fixo? ")
    hm_category_for_report = fields.Selection(
        [('liquidez', 'Liquidez'), 
         ('a_receber', 'A receber'),
         ('a_pagar', 'A pagar'), 
         ('ativo_corrente', 'Ativo Corrente'), 
         ('receita', 'Receita'),  
         ('despesa', 'Despesa')], 
        string="Categoria para Relatórios")

