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
    "data": [
        'views/card_operators_views.xml',
        'views/account_journal.xml',
        'views/pos_payment_method.xml',
        'views/view_pos_pos_form.xml',
        'views/view_pos_payment_tree.xml',
        'views/account_payment_view.xml',
        'security/ir.model.access.csv',
        'data/hm.card.operators.csv',
        'wizard/account_payment_register_views.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'hm_card_payment_pos/static/src/js/hm_models.js',
            'hm_card_payment_pos/static/src/js/hm_db.js',
            'hm_card_payment_pos/static/src/js/Screens/PaymentScreen/hmPaymentScreenPaymentLines.js',
            'hm_card_payment_pos/static/src/js/Screens/PaymentScreen/HmPaymentScreen.js',
            'hm_card_payment_pos/static/src/js/Popups/SelectCardFlagPopupWidget.js',
            
            
            
            
        ],
        'web.assets_qweb': [
            'hm_card_payment_pos/static/src/xml/**/*',
        ],
    },
    'images': ['hm_card_payment_pos/static/images/screen_image.png'],
    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'OPL-1',
    'external_dependencies': {
    },
}
