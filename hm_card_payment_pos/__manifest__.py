{
    'name': 'Pagamento com cartão de credito no POS',
    'version': '15.0.0.1',
    'category': 'Point of Sale',
    'summary': 'Configurações para pagamento com cartão externo, Calcula taxas.',
    'description': 'Realiza configurações no POS para pagamento com cartão externo',
    'author': 'Grupo Hasmany',
    'website': 'https://www.instagram.com/hasmanysistemas/',
    'support': 'david.lza@hotmail.com',
    'depends': ['point_of_sale','account'],
    "data": ['views/account_journal.xml'],
    'assets': {
        'point_of_sale.assets': [
            'hm_card_payment_pos/static/src/js/Screens/PaymentScreen/hmPaymentScreen.js',
            
        ],
        # 'web.assets_qweb': [
        #     'hm_card_payment_pos/static/src/xml/**/*',
        # ],
    },
    'images': ['static/images/screen_image.png'],
    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'OPL-1',
    'external_dependencies': {
    },
}
