const express = require('express');
const router = express.Router();
const OrderController = require('../../controller/order.controller');

router.get('/list', OrderController.list);
router.post('/add', OrderController.add);
router.post('/delivery/fee', OrderController.deliveryFeeCalculator);
router.get('/info/:_id', OrderController.info);
router.put('/done/:_id', OrderController.doneItem);
router.put('/cancel/:_id', OrderController.cancelItem);
router.get('/payment/checking/:orderId', OrderController.checkingPaymentProcess);
router.get('/payment/:orderId', OrderController.payWithAppota);

module.exports = router;