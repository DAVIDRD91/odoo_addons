{
    'name': "Hasmany Whatsapp",
    'summary': """
        Modulo adptado para brasil.
        Este módulo permite enviar mensagens de whatsapp sobre os pedidos de venda, pedidos de compra,
        valor do pedido da fatura e pedidos de entrega junto com os itens do pedido para o respectivo usuário.""",

    'description': """
    """,
    'author': "Hasmany and Techspawn Solutions Pvt. Ltd.",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/13.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Whatsapp',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'sale', 'web', 'stock', 'purchase','account','contacts'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'security/sms_security.xml',
        'wizard/wizard_multiple_contact.xml',
        'views/views.xml',
        'views/template.xml',
        'views/setting_inherit_view.xml',
        'wizard/message_wizard.xml',
        'wizard/wizard.xml',
        'wizard/wizard_contact.xml',
        'wizard/share_action.xml',
    ],
    'images':['static/description/main.gif'],
}
