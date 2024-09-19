const express = require('express');
const router = express.Router();

const AccountRouter = require('./account/no_login_account.router');
const BannerRouter = require('./banner/no_login.router');
const ProviderRouter = require('./provider/no_login.router');
const CategoryRouter = require('./category/no_login.router');
const WarehouseRouter = require('./warehouse/no_login.router');
const ProductRouter = require('./product/no_login.router');
const SearchRouter = require('./search/no_login.router');
const NewsRouter = require('./news/no_login.router');
const VietnamRouter = require('./vietnam_district/no_login.router');

const OrderController = require('../controller/order.controller');

const ConfigRouter = require('../controller/config.controller');

router.use('/account', AccountRouter);
router.use('/banner', BannerRouter);
router.use('/provider', ProviderRouter);
router.use('/category', CategoryRouter);
router.use('/warehouse', WarehouseRouter);
router.use('/product', ProductRouter);
router.use('/search', SearchRouter);
router.use('/news', NewsRouter);
router.use('/vietnam', VietnamRouter);

router.post('/ipn', OrderController.ipn);
router.get('/config/profile', ConfigRouter.profile);

module.exports = router;