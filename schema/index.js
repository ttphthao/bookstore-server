const mongoose = require('mongoose');

const db = mongoose.createConnection(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

db.model('Account', require('./models/account.model'));
db.model('Category', require('./models/category.model'));
db.model('Provider', require('./models/provider.model'));
db.model('Warehouse', require('./models/warehouse.model'));
db.model('Cart', require('./models/cart.model'));
db.model('Product', require('./models/product.model'));
db.model('ProductInfo', require('./models/productInfo.model'));
db.model('ShippingInfo', require('./models/shippingInfo.model'));
db.model('Session', require('./models/session.model'));
db.model('Order', require('./models/order.model'));
db.model('Banner', require('./models/banner.model'));
db.model('Config', require('./models/config.model'));
db.model('News', require('./models/news.model'));
db.model('Vietnam', require('./models/vietnam.model'));

module.exports = db;