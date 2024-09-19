const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    type: { type: String, default: "" },
    htmlString: { type: String, default: "" },
});

Schema.set('timestamps', true);

module.exports = Schema;