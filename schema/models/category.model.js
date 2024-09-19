const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: { type: String, require: true },
    image: { type: String },
    icon: { type: String },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;