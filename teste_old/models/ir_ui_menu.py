from odoo import fields, models


class IrUiMenu(models.Model):
    _inherit = "ir.ui.menu"

    #Força a criação do campo web_icon_data
    web_icon_data = fields.Binary(string='Web Icon Image', attachment=True)

