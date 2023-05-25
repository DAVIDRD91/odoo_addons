# © 2023 David Rodrigues, HasMany Sistemas

from odoo import fields, models


class HmCardOperators(models.Model):
    _name = 'hm.card.operators'
    _description = 'card operators'

    sequence = fields.Integer('Codigo', default=1)
    name = fields.Char(string="Nome")
    type = fields.Selection(
        [('credito', 'Credito'), 
         ('debito', 'Debito')], 
        string="Tipo da operação")
    transaction_fee = fields.Float(string="Valor da tarifa (%): ")
    portion_transaction_fee = fields.Float(string="Valor da tarifa parcelado (%): ")
    days_to_receive = fields.Integer('Dias Para receber', default=1)
    
    image = fields.Image(
        string="Image", max_width=64, max_height=64,
        help="This field holds the image used for this payment icon, limited to 64x64 px")
    
