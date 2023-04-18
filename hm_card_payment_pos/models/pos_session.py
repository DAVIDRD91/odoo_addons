from odoo import api, fields, models, _, Command

from odoo.tools import float_compare

class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.model
    def _create_combine_account_payment(self, payment_method, amounts, diff_amount):
        outstanding_account = payment_method.outstanding_account_id or self.company_id.account_journal_payment_debit_account_id
        destination_account = self._get_receivable_account(payment_method)

        if float_compare(amounts['amount'], 0, precision_rounding=self.currency_id.rounding) < 0:
            # revert the accounts because account.payment doesn't accept negative amount.
            outstanding_account, destination_account = destination_account, outstanding_account

        account_payment = self.env['account.payment'].create({
            'amount': abs(amounts['amount']),
            'journal_id': payment_method.journal_id.id,
            'force_outstanding_account_id': outstanding_account.id,
            'destination_account_id':  destination_account.id,
            'ref': _('Combine %s POS payments from %s') % (payment_method.name, self.name),
            'pos_payment_method_id': payment_method.id,
            'pos_session_id': self.id,
        })

        #Verificar se a forma de pagamento tem custo de transação e lança o valor do custo.
        #if payment_method.hm_has_transaction_fee:
        if payment_method.journal_id.hm_has_transaction_fee:
            self._generate_transaction_cost(account_payment, payment_method,abs(amounts['amount']))

        diff_amount_compare_to_zero = self.currency_id.compare_amounts(diff_amount, 0)
        if diff_amount_compare_to_zero != 0:
            self._apply_diff_on_account_payment_move(account_payment, payment_method, diff_amount)

        account_payment.action_post()
        return account_payment.move_id.line_ids.filtered(lambda line: line.account_id == account_payment.destination_account_id)

    def _generate_transaction_cost(self, account_payment, payment_method, amount):
        transaction_fee = payment_method.journal_id.hm_transaction_fee
        transaction_amount = -(amount * (transaction_fee / 100))

        source_vals, dest_vals = self._get_diff_vals(payment_method.id, transaction_amount)
        outstanding_line = account_payment.move_id.line_ids.filtered(lambda line: line.account_id.id == source_vals['account_id'])
        new_balance = abs(outstanding_line.balance + transaction_amount)
        new_balance_compare_to_zero = self.currency_id.compare_amounts(new_balance, 0)

        #Seta conta de cobrança de tarifa
        dest_vals['account_id'] = payment_method.journal_id.hm_fee_account_id.id
        dest_vals['name'] = _('Despesas com %s ') % (payment_method.name)

        account_payment.move_id.write({
            'line_ids': [
                Command.create(dest_vals),
                Command.update(outstanding_line.id, {
                    'debit': new_balance_compare_to_zero > 0 and new_balance or 0.0,
                    'credit': new_balance_compare_to_zero < 0 and -new_balance or 0.0
                })
            ]
        })