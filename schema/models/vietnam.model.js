const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: { type: String, reqruire: true },
    type: { type: String },
    slug: { type: String },
    name_with_type: { type: String },
    path_with_type: { type: String },
    code: { type: String },
    parent_code: { type: String },
});

Schema.set('timestamps', true);

module.exports = Schema;