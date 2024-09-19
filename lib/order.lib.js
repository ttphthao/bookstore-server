const Order = require('../schema').models.Order;
const Cart = require('../schema').models.Cart;
const ProductInfo = require('../schema').models.ProductInfo;
const JWT = require('jsonwebtoken');
const axios = require('axios');

async function setPackingStatus(orderId) {
    const order = await Order.findOne({ _id: orderId });
    if (order.paymentMethod == 'appota') return false;

    await Order.updateOne({ _id: orderId }, {
        $set: {
            status: 'packing',
        }
    });
}

async function setShippingStatus(orderId) {
    const order = await Order.findOne({ _id: orderId });
    if (order.paymentMethod == 'appota' && order.status == 'new') return false;

    await Order.updateOne({ _id: orderId }, {
        $set: {
            status: 'shipping'
        }
    });
}

async function setDoneStatus(orderId) {
    await Order.updateOne({ _id: orderId }, {
        $set: {
            status: 'done'
        }
    });
}

async function setCancelStatus(orderId) {
    await Order.updateOne({ _id: orderId }, {
        $set: {
            status: 'cancel'
        }
    });
}

function MakeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }

    const date = '' + new Date().getTime();
    result += date.slice(7);

    return result;
}

async function deliveryFeeCalculatator(weight, price, provine, city) {
    const provineFree = ['Ba Đình', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hoàn Kiếm', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Hà Đông', 'Tây Hồ', 'Nam Từ Liêm', 'Bắc Từ Liêm'];
    if (price > 300000 && city == 'Hà Nội' && provineFree.includes(provine)) return 0;
    if (city == 'Hà Nội') {
        if (weight < 250) return 16500;
        if (weight < 500) return 22000;
        if (weight > 500) {
            weight -= 500;
            return 22000 + 2500 * Math.floor(weight / 500);
        }
    }

    if (weight < 250) return 31000;
    if (weight < 500) return 32000;
    weight -= 500;
    return 32000 + 5000 * Math.floor(weight / 500);
}

async function payWithAppota(orderId) {
    const order = await Order.findOne({ orderId, status: 'new' });
    if (!order) return null;

    const TOKEN = JWT.sign({
        iss: process.env.PARTNER_CODE,
        jti: process.env.API_KEY + "-" + new Date().getTime(),
        api_key: process.env.API_KEY,
        exp: Math.floor(new Date().setHours(new Date().getHours() + 1) / 1000)
    }, process.env.SECRET_KEY);

    const data = {
        "transaction": {
            "amount": order.price + order.delivery_fee,
            "currency": "VND",
            "bankCode": "",
            "paymentMethod": "ALL",
            "action": "PAY"
        },
        "partnerReference": {
            "order": {
                "id": orderId,
                "info": "bookstore DON HANG " + orderId,
                "extraData": ""
            },
            "notificationConfig": {
                "notifyUrl": "https://backend.bookstore.vn/api/v1/ipn",
                "redirectUrl": "https://bookstore.vn/user/purchase",
                "installmentNotifyUrl": "https://backend.bookstore.vn/api/v1/ipn"
            }
        }
    }

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.APPOTA_URL + '/api/v2/orders/payment',
        headers: {
            'X-Language': 'vi',
            'X-APPOTAPAY-AUTH': TOKEN
        },
        data: data
    };

    const jsonData = await axios.request(config);
    if (!jsonData?.data?.payment?.url) return null;

    return jsonData?.data?.payment?.url;
}

async function checkingPaymentProcess(orderId) {
    const order = await Order.findOne({ orderId });
    if (!order) return false;

    const TOKEN = JWT.sign({
        iss: process.env.PARTNER_CODE,
        jti: process.env.API_KEY + "-" + new Date().getTime(),
        api_key: process.env.API_KEY,
        exp: Math.floor(new Date().setHours(new Date().getHours() + 1) / 1000)
    }, process.env.SECRET_KEY);

    const data = {
        "referenceId": orderId,
        "type": "PARTNER_ORDER_ID"
    }

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.APPOTA_URL + '/api/v2/orders/transaction',
        headers: {
            'X-Language': 'vi',
            'X-APPOTAPAY-AUTH': TOKEN
        },
        data: data
    };

    const jsonData = await axios.request(config);
    if (!jsonData?.data) return false;

    const orderStatus = jsonData?.data?.transaction?.status;
    if (orderStatus == 'error' || !orderStatus) {
        const cart = order.cart || [];
        for (let c = 0; c < cart.length; ++c) {
            const getCart = await Cart.findOne({ _id: cart[c] })
                .populate('type');

            await ProductInfo.updateOne({ _id: getCart.type?._id }, {
                $set: {
                    amount: getCart.type?.amount + getCart.amount,
                    sold: getCart.type?.sold - getCart.amount,
                }
            });
        }

        await Order.updateOne({ orderId }, {
            $set: {
                status: 'cancel',
            }
        });
    }
    else if (orderStatus == 'success') {
        await Order.updateOne({ orderId }, {
            $set: {
                status: 'packing',
            }
        });
    }

    return true;
}

module.exports = {
    setPackingStatus,
    setShippingStatus,
    setDoneStatus,
    setCancelStatus,
    MakeId,
    payWithAppota,
    deliveryFeeCalculatator,
    checkingPaymentProcess,
}