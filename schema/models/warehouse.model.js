const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;