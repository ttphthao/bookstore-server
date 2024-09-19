const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    address: { type: String, require: true },
    ward: { type: String, require: true },
    provine: { type: String, require: true },
    city: { type: String, require: true },
    country: { type: String, require: true },
    phone_number: { type: String, require: true },
    wardCode: {type: Number},
    cityCode: {type: Number},
    provineCode: {type: Number},
    name: { type: String, require: true },
    default: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;
