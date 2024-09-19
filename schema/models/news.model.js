const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    brief: { type: String, default: "" },
    image: { type: String, default: "" },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

module.exports = Schema;