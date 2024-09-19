const Vietnam = require('../schema').models.Vietnam;

async function getWithParentCode(req, res) {
    const { parent_code } = req.query;
    const data = await Vietnam.find({ parent_code: parent_code || null });

    return res.json({ success: 'true', data });
}

module.exports = {
    getWithParentCode,
}