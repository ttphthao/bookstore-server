const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductInfo' },
    amount: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    bought: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;