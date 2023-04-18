{
    'name': "Customizações Patty Bordados",
    'summary': "Customizações para empressa Patty Bordados",
    'description': """Customizações para empressa Patty Bordados.""",
    'author': "Grupo HasMany",
    'category': 'customization',
    'license': 'OPL-1',
    'version': '15.0.0.0.1',
    'depends': [
        'base',
        'product',
    ],
    'data': [
        'views/pb_custom_doc_tax_totals.xml',
        'views/pb_custom_rel_sale_order.xml',
        'views/pb_add_medidas_sale_order.xml',
        'views/pb_custom_head.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
