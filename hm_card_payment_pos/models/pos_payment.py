# © 2023 David Rodrigues, HasMany Sistemas

from odoo import fields, models


class PosPayment(models.Model):
    _inherit = 'pos.payment'

    hm_amount_card_fee = fields.Monetary(string='Valor da taxa de cartão')

    def _export_for_ui(self, payment):
        return {
            'payment_method_id': payment.payment_method_id.id,
            'amount': payment.amount,
            'payment_status': payment.payment_status,
            'card_type': payment.card_type,
            'cardholder_name': payment.cardholder_name,
            'transaction_id': payment.transaction_id,
            'ticket': payment.ticket,
            'is_change': payment.is_change,
            'hm_amount_card_fee': payment.hm_amount_card_fee,
        }

