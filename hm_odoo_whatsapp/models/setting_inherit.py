from odoo import models, fields, api, _

class CustomSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    group_send_sms = fields.Boolean(string="Mensagens Pelo Whatsapp", implied_group='hm_odoo_whatsapp.group_send_sms')