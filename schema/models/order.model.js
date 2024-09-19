const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    shippingInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingInfo' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }],
    status: { type: String, default: 'new' },
    orderId: { type: String },
    price: { type: Number, default: 0 },
    estReceived: { type: Date },
    reaReceived: { type: Date },
    delivery_fee: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'cod' },
});

Schema.set('timestamps', true);

module.exports = Schema;