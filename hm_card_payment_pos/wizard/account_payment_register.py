# © 2023 David Rodrigues, Hasmany

# -*- coding: utf-8 -*-

from odoo import models, fields, api, _, Command
from odoo.exceptions import UserError

class AccountPaymentRegister(models.TransientModel):
    _inherit = 'account.payment.register'

    hm_operator_id = fields.Many2one('hm.card.operators', string='Bandeira do Cartão')

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

    #########################################
    ## @ override
    ## Função sobre escrita para realizar o calculo de tarifas por transação bancaria
    ## E lança o valor como despesa
    ## David 26-03-23
    #########################################
    def _create_payment_vals_from_wizard(self):
        
        payment_vals = super(AccountPaymentRegister,self)._create_payment_vals_from_wizard()

        
        if self.hm_operator_id and (not self.hm_hide_operator_id):
            
            transaction_fee = self.hm_operator_id.transaction_fee
            fee_amount = round( (self.amount * (transaction_fee / 100)) ,2 )
            self.amount = round( self.amount - fee_amount, 2)
        
            ## Se houver diferença de valor aborta o pagamento
            if not self.currency_id.is_zero(self.payment_difference) and self.payment_difference_handling == 'reconcile':
                raise UserError(_("Não e possivel Registrar perda de valor para pagamentos em cartão"))
            
            payment_vals['amount'] = self.amount

            #Seta o valor da taxa a ser abatido
            payment_vals['write_off_line_vals'] = {
                'name': 'Despesas com Taxa de Cartão',
                'amount': fee_amount,
                'account_id': self.journal_id.hm_fee_account_id.id,
            }
        return payment_vals