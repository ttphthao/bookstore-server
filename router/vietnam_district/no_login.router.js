const express = require('express');
const router = express.Router();
const VietnamController = require('../../controller/vietnam_district.controller');

router.get('/', VietnamController.getWithParentCode);

module.exports = router;