const schedule = require('node-schedule');
const Order = require('./schema').models.Order;
const OrderLib = require('./lib/order.lib');

schedule.scheduleJob('*/5 * * * * *', async () => {
    console.log('run check order paid with appota payment');
    try {
        const orders = await Order.find({ paymentMethod: 'appota', status: 'new' });
        for (let i = 0; i < orders.length; ++i) {
            const order = orders[i];
            await OrderLib.checkingPaymentProcess(order.orderId);
        }
    } catch (err) {
        console.log(err);
    }
});