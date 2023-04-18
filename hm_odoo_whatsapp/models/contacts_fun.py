from queue import Empty
from odoo import models, fields, api, _

class SaleOrderValidation(models.Model):
    _inherit = 'res.partner'

    mobile = fields.Char(default="+5561 ")
    phone = fields.Char(default="+5561 ")
    # hm_cod_ddi = fields.Char(string="Código do Pais",default="+55")

    def contact_whatsapp(self):
        record_phone = self.mobile

        if not record_phone or len(record_phone) < 8 :
            record_phone = self.phone

        if not record_phone == "+":
            record_phone = "+55"+record_phone

        if not record_phone[0] == "+" or len(record_phone) < 8:
            view = self.env.ref('hm_odoo_whatsapp.warn_message_wizard')
            view_id = view and view.id or False
            context = dict(self._context or {})
            context['message'] = "Nenhum código de país! Adicione um número de celular válido junto com o código do país!"
            return {
                'name': 'Invalid Mobile Number',
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'display.error.message',
                'views': [(view.id, 'form')],
                'view_id': view.id,
                'target': 'new',
                'context': context
            }
        else:
            return {'type': 'ir.actions.act_window',
                    'name': _('Whatsapp Message'),
                    'res_model': 'whatsapp.wizard.contact',
                    'target': 'new',
                    'view_mode': 'form',
                    'view_type': 'form',
                    'context': {
                        'default_template_id': self.env.ref('hm_odoo_whatsapp.whatsapp_contacts_template').id},
                    }