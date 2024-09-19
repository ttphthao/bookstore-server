const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    group1: { type: String },
    group2: { type: String },
    name: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    amountSale: { type: Number, default: 0 },
    priceSale: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
});

Schema.set('timestamps', true);

module.exports = Schema;