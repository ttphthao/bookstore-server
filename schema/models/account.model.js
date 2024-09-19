const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = new mongoose.Schema({
    email: { type: String, require: true, unique: true, lowercase: true },
    password: { type: String, require: true },
    name: { type: String, require: true },
    phone_number: { type: String },
    role: { type: String, default: 'user', enum: ['admin', 'user'] },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    delete: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
});

Schema.set('timestamps', true);

Schema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(this.password, salt);
        this.password = passwordHashed;

        next();
    } catch (error) {
        next(error);
    }
})

Schema.methods.isValidPassword = async function (pwd) {
    try {
        return await bcrypt.compare(pwd, this.password) && !this.hide && !this.delete;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = Schema;