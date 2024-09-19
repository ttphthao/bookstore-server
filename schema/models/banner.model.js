const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: { type: String },
    image: { type: String },
    order: { type: Number, default: 99 },
    expired: { type: Date },
    always: { type: Boolean, default: false },
    main: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
    pos1: { type: Boolean, default: false },
    pos2: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;