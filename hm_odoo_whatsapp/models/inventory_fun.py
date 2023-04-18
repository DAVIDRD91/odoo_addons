from odoo import models, fields, api, _
import urllib.parse as parse
from odoo.exceptions import UserError
from itertools import groupby

class InventoryTransferDone(models.Model):
    _inherit = 'stock.picking'

    def inventory_whatsapp(self):
        record_phone = self.partner_id.mobile

        if not record_phone or len(record_phone[0]) < 8 :
            record_phone = self.partner_id.phone

        if not record_phone == "+":
            record_phone = "+55"+record_phone

        if not record_phone or len(record_phone) < 8:
            view = self.env.ref('hm_odoo_whatsapp.warn_message_wizard')
            view_id = view and view.id or False
            context = dict(self._context or {})
            context['message'] = "Adicione um número de celular!"
            return {
                'name': 'Mobile Number Field Empty',
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'display.error.message',
                'views': [(view.id, 'form')],
                'view_id': view.id,
                'target': 'new',
                'context': context
            }
        if not record_phone[0] == "+":
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
                    'res_model': 'whatsapp.wizard',
                    'target': 'new',
                    'view_mode': 'form',
                    'view_type': 'form',
                    'context': {
                        'default_template_id': self.env.ref('hm_odoo_whatsapp.whatsapp_inventory_template').id},
                    }

    def send_direct_message(self):
        record_phone = self.partner_id.mobile

        if not record_phone or len(record_phone) < 8 :
            record_phone = self.partner_id.phone

        if not record_phone == "+":
            record_phone = "+55"+record_phone

        if not record_phone or len(record_phone) < 8:
            view = self.env.ref('hm_odoo_whatsapp.warn_message_wizard')
            view_id = view and view.id or False
            context = dict(self._context or {})
            context['message'] = "Adicione um número de celular!"
            return {
                'name': 'Mobile Number Field Empty',
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'display.error.message',
                'views': [(view.id, 'form')],
                'view_id': view.id,
                'target': 'new',
                'context': context
            }
        if not record_phone[0] == "+":
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
            prods = ""
            for rec in self:
                for id in rec.move_ids_without_package:
                            prods = prods + "*" +str(id.product_id.name) + " : " + str(id.product_uom_qty) + "* \n"

            custom_msg = "Olá *{}*, seu pedido *{}* está Pronto.\n O pedido contém os seguintes itens: \n{}".format(
                str(self.partner_id.name), str(self.name), prods)
            ph_no = [number for number in record_phone if number.isnumeric()]
            ph_no = "".join(ph_no)
            ph_no = "+" + ph_no

            link = "https://web.whatsapp.com/send?phone=" + ph_no
            message_string = parse.quote(custom_msg)

            url_id = link + "&text=" + message_string
            return {
                'type': 'ir.actions.act_url',
                'url': url_id,
                'target': 'new',
                'res_id': self.id,
            }

    def check_value(self, partner_ids):
        partners = groupby(partner_ids)
        return next(partners, True) and not next(partners, False)

    def multi_sms(self):
        inventory_order_ids = self.env['stock.picking'].browse(self.env.context.get('active_ids'))

        cust_ids = []
        inventory_nums = []
        for inventory in inventory_order_ids:
            cust_ids.append(inventory.partner_id.id)
            inventory_nums.append(inventory.name)

        # To check unique customers
        cust_check = self.check_value(cust_ids)

        if cust_check:
            inventory_numbers = inventory_order_ids.mapped('name')
            inventory_numbers = "\n".join(inventory_numbers)

            form_id = self.env.ref('hm_odoo_whatsapp.whatsapp_multiple_message_wizard_form').id
            product_all = []
            for each in inventory_order_ids:
                prods = ""
                for id in each.move_ids_without_package:
                    prods = prods + "*" +  "Produto: " + str(id.product_id.name) +  "* \n"
                product_all.append(prods)

            custom_msg = "Olá" + " " + self.partner_id.name + ',' + '\n' + "Seus pedidos" + '\n' + inventory_numbers + \
                         ' ' + '\n' + "estão prontos para revisão.\n"
            counter = 0
            for every in product_all:
                custom_msg = custom_msg + "Seu pedido " + "*" + inventory_nums[
                    counter] + "*" + " contém os seguintes itens: \n{}".format(every) + '\n'
                counter += 1

            final_msg = custom_msg + "\n Não hesite em nos contatar se tiver alguma dúvida."

            ctx = dict(self.env.context)
            ctx.update({
                'default_message': final_msg,
                'default_partner_id': self.partner_id.id,
                'default_mobile': self.partner_id.mobile,
            })
            return {
                'type': 'ir.actions.act_window',
                'view_mode': 'form',
                'res_model': 'whatsapp.wizard.multiple.contact',
                'views': [(form_id, 'form')],
                'view_id': form_id,
                'target': 'new',
                'context': ctx,
            }
        else:
            raise UserError(_('Selecione pedidos de clientes únicos'))