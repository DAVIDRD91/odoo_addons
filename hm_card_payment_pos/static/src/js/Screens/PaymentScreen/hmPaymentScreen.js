// odoo.define('hm_card_payment_pos.hmPaymentScreen', function (require) {
//     "use strict";
	
// 	const PaymentScreen = require('point_of_sale.PaymentScreen');
//     const Registries = require('point_of_sale.Registries');


// 	const hmPaymentScreen = (PaymentScreen) =>
// 		class extends PaymentScreen {
//             /**
//              * @override
//              */
// 			async validateOrder(isForceValidate) {
//                 console.log('hm validateOrder')
//                 this.validaPagCartao();

//                 await super.validateOrder(isForceValidate);
//             };

//             validaPagCartao(){
//                 console.log('validaPagCartao',this.paymentLines)
//             };
// 		};

// 	Registries.Component.extend(PaymentScreen, hmPaymentScreen);

// 	return PaymentScreen;

// });

