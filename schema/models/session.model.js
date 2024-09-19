const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    cookie: { type: String },
    expired: { type: Date },
});

Schema.set('timestamps', true);

module.exports = Schema;