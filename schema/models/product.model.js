const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: { type: String, default: "" },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    description: { type: String, default: "" },
    image: [{ type: String, default: [] }],
    group1: { type: String },
    group2: { type: String },
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductInfo' }],
    return: { type: Number, default: 0 },
    startSale: { type: Date },
    endSale: { type: Date },
    weight: { type: Number },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;