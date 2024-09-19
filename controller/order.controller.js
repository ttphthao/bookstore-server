const Order = require('../schema').models.Order;
const Cart = require('../schema').models.Cart;
const Product = require('../schema').models.Product;
const ProductInfo = require('../schema').models.ProductInfo;
const Warehouse = require('../schema').models.Warehouse;
const ShippingInfo = require('../schema').models.ShippingInfo;

const JWT = require('jsonwebtoken');
const axios = require('axios');

const OrderLib = require('../lib/order.lib');
const MAX_ORDER = 100000000;

async function splitCartFunc(index, owner, shippingInfo, warehouse, cart, splitCart, splitPrice) {
    if (index >= cart.length) {
        if (splitPrice != 0) {
            const orderId = OrderLib.MakeId(6);
            const price = splitPrice;
            const today = new Date();
            const estReceived = new Date(today.setDate(today.getDate() + 5));

            const newOrder = new Order({ owner, warehouse, cart: splitCart, price, orderId, estReceived, shippingInfo });
            newOrder.save(newOrder);
        }
        return;
    }
    if (cart[index].amount <= 0) await splitCartFunc(index + 1, owner, shippingInfo, warehouse, cart, splitCart, splitPrice);
    if (cart[index].price * cart[index].amount + splitPrice <= MAX_ORDER) {
        const newCart = new Cart({ owner, product: cart[index].product, type: cart[index].type, amount: cart[index].amount, bought: true });
        const getCart = await newCart.save(newCart);
        splitCart.push(getCart._id);

        await splitCartFunc(index + 1, owner, shippingInfo, warehouse, cart, splitCart, splitPrice + cart[index].price * cart[index].amount);
    }
    else {
        const amount = Math.floor(Math.max(0, (MAX_ORDER - splitPrice)) / cart[index].price);
        if (amount != 0) {
            const orderId = OrderLib.MakeId(6);
            const price = splitPrice + cart[index].price * amount;
            const today = new Date();
            const estReceived = new Date(today.setDate(today.getDate() + 5));

            const newCart = new Cart({ owner, product: cart[index].product, type: cart[index].type, amount: amount, bought: true });
            const getCart = await newCart.save(newCart);
            splitCart.push(getCart._id);

            const newOrder = new Order({ owner, warehouse, cart: splitCart, price, orderId, estReceived, shippingInfo });
            newOrder.save(newOrder);

            cart[index].amount -= amount;
            await splitCartFunc(index, owner, shippingInfo, warehouse, cart, [], 0);
        }
        else {
            const orderId = OrderLib.MakeId(6);
            const price = splitPrice;
            const today = new Date();
            const estReceived = new Date(today.setDate(today.getDate() + 5));

            if (price != 0) {
                const newCart = new Cart({ owner, product: cart[index].product, type: cart[index].type, amount: cart[index].amount, bought: true });
                const getCart = await newCart.save(newCart);
                splitCart.push(getCart._id);

                const shipping = await ShippingInfo.findOne({ _id: shippingInfo });
                let delivery_fee = await OrderLib.deliveryFeeCalculatator(weight, price, shipping.provine, shipping.city);

                const newOrder = new Order({ owner, warehouse, cart: splitCart, price, orderId, estReceived, shippingInfo, delivery_fee });
                newOrder.save(newOrder);
            }
            else {
                const shipping = await ShippingInfo.findOne({ _id: shippingInfo });
                let delivery_fee = await OrderLib.deliveryFeeCalculatator(weight, price, shipping.provine, shipping.city);

                const newOrder = new Order({ owner, warehouse, cart: [cart[index]._id], price: cart[index].amount * cart[index].price, orderId, estReceived, shippingInfo, delivery_fee });
                newOrder.save(newOrder);
            }

            await splitCartFunc(index + 1, owner, shippingInfo, warehouse, cart, [], 0);
        }
    }
}

async function add(req, res) {
    const { carts, shippingInfo, paymentMethod } = req.body;
    const owner = req.user._id;

    if (!carts || !carts.length) return res.status(400).json({ success: false, message: 'Carts is reqired and must be array!' });

    const shipping = await ShippingInfo.findOne({ _id: shippingInfo });
    if (!shipping) return res.status(404).json({ success: false, message: 'Not found shipping info!' });

    const data = [];
    const mapId = {};
    const today = new Date();

    let weight = 0;
    let paymentUrl;

    for (let i = 0; i < carts.length; ++i) {
        const cart = await Cart.findOne({ _id: carts[i] })
            .populate('product')
            .populate('type');

        if (!cart) return res.status(404).json({ success: false, message: 'Not found cart!', data: carts[i] });
        if (cart.amount > cart?.type?.amount)
            return res.status(400).json({ success: false, message: 'Not enough product amount!', data: carts[i] });

        const warehouse = cart.product?.warehouse;

        if (mapId[warehouse] == null) {
            mapId[warehouse] = data.length;
            data.push({
                warehouse,
                cart: [],
                cartInfo: [],
                price: 0
            });
        }

        weight += cart?.product?.weight || 0;

        const index = mapId[warehouse];
        const found = data[index].cart.findIndex((i) => i === carts[i]);
        if (found != -1) continue;

        const tmpCart = cart;
        tmpCart.price = cart?.price;

        // if (cart?.product?.startSale < today && cart?.product?.endSale > today && cart?.type?.amountSale >= cart?.amount) {
        //     tmpCart.price = cart?.type?.priceSale;
        //     data[index].price += cart?.amount * cart?.type?.priceSale;
        // }
        // else {
        data[index].price += cart?.amount * cart?.price;
        // }

        data[index].cartInfo.push(tmpCart);
        data[index].cart.push(carts[i]);
    }

    for (let i = 0; i < data.length; ++i) {
        const warehouse = data[i].warehouse;
        const price = data[i].price;
        const cart = data[i].cart;
        const cartInfo = data[i].cartInfo?.sort((a, b) => a.price - b.price);

        const orderId = OrderLib.MakeId(6);
        const today = new Date();
        const estReceived = new Date(today.setDate(today.getDate() + 5));

        if (price > MAX_ORDER) {
            splitCartFunc(0, owner, shippingInfo, warehouse, cartInfo, [], 0);
        }
        else {
            let delivery_fee = await OrderLib.deliveryFeeCalculatator(weight, price, shipping.provine, shipping.city);

            const newOrder = new Order({ owner, warehouse, cart, price, orderId, estReceived, shippingInfo, delivery_fee, paymentMethod });
            newOrder.save(newOrder);

            if (paymentMethod == 'appota') {
                paymentUrl = await OrderLib.payWithAppota(orderId);
                if (!paymentUrl) return res.status(403).json({ success: false, message: 'ERROR_CREATE_PAYMENT_URL!' })
            }
        }

        for (let c = 0; c < cart.length; ++c) {
            const getCart = await Cart.findOne({ _id: cart[c] })
                .populate('product')
                .populate('type');
            if (getCart?.product?.startSale < new Date() && getCart?.product?.endSale > new Date()) {
                amount = getCart.type?.amountSale;
                await ProductInfo.updateOne({ _id: getCart.type?._id }, {
                    $set: {
                        amountSale: Math.max(0, amount - getCart.amount),
                        amount: Math.max(0, amount - getCart.amount),
                        sold: getCart.type?.sold + getCart.amount,
                    }
                });
            }
            else {
                await ProductInfo.updateOne({ _id: getCart.type?._id }, {
                    $set: {
                        amount: Math.max(0, getCart.type?.amount - getCart.amount),
                        sold: getCart.type?.sold + getCart.amount,
                    }
                });
            }

            await Cart.updateOne({ _id: cart[c] }, {
                $set: {
                    bought: true,
                }
            });
        }
    }

    return res.status(201).json({
        success: true,
        message: "Added order to db!",
        data: paymentUrl,
    });
}

async function list(req, res) {
    const user = req.user;
    const { status } = req.query;

    const query = {
        hide: { $ne: true },
        delete: { $ne: true },
        owner: user._id,
    };

    // if (user.role == 'editor') {
    //     const getWarehouse = await Warehouse.find({ manager: user._id })
    //         .select('_id');
    //     const warehouseId = getWarehouse.map((w) => { return w._id });
    //     query['warehouse'] = { "$in": warehouseId };
    // }

    // if (user.role == 'user') {
    //     query['owner'] = user._id;
    // }

    if (!!status) {
        query['status'] = status;
    }

    const orders = await Order.find(query)
        .populate('warehouse')
        .populate('shippingInfo')
        .populate({
            path: 'cart',
            populate: [{
                path: 'type',
                model: ProductInfo
            }, {
                path: 'product',
                model: Product
            }],
        })
        .sort({ "createdAt": -1 });

    for (let i = 0; i < orders.length; ++i) {
        const cart = orders[i].cart;
        for (let j = 0; j < cart.length; ++j) {
            orders[i].cart[j].type.price = cart[j].price;
        }
    }

    res.json({
        success: true,
        data: orders,
    });
}

async function adminList(req, res) {
    const { limit, page, status } = req.query;
    const user = req.user;

    const query = {
        delete: { $ne: true }
    };

    let lim = 20;
    let pa = 1;

    if (!!limit) lim = limit * 1;
    if (!!page) pa = page * 1;

    if (user.role == 'editor') {
        const getWarehouse = await Warehouse.find({ manager: user._id })
            .select('_id');
        const warehouseId = getWarehouse.map((w) => { return w._id });
        query['warehouse'] = { "$in": warehouseId };
    }

    if (!!status) {
        query['status'] = status;
    }

    const orders = await Order.find(query)
        .populate('warehouse')
        .populate('shippingInfo')
        .populate('owner', '-password')
        .populate({
            path: 'cart',
            populate: [{
                path: 'type',
                model: ProductInfo
            }, {
                path: 'product',
                model: Product
            }],
        })
        .sort({ "createdAt": -1 })
        .skip(lim * (pa - 1))
        .limit(lim);

    const count = await Order.countDocuments(query);
    const data = [];

    for (let i = 0; i < orders.length; ++i) {
        const cart = orders[i].cart;
        for (let j = 0; j < cart.length; ++j) {
            orders[i].cart[j].type.price = cart[j].price;
        }
    }

    for (let i = 0; i < orders.length; ++i) {
        const ord = orders[i].toObject();
        ord.shippingInfo.phone_number = ord.owner?.phone_number;

        data.push(ord);
    }

    res.json({
        success: true,
        data,
        pagination: {
            page: pa,
            limit: lim,
            totalData: count
        }
    });
}

async function info(req, res) {
    const { _id } = req.params;

    const order = await Order.findOne({ _id })
        .populate('warehouse')
        .populate('shippingInfo')
        .populate({
            path: 'cart',
            populate: [{
                path: 'type',
                model: ProductInfo
            }, {
                path: 'product',
                model: Product
            }],
        });


    const cart = order.cart;
    for (let j = 0; j < cart.length; ++j) {
        order.cart[j].type.price = cart[j].price;
    }


    return res.json({ success: true, data: order });
}

async function deleteItem(req, res) {
    const { _id } = req.params;

    const item = await Order.updateOne({ _id }, {
        $set: {
            delete: true,
        }
    });

    return res.json({ success: true, message: 'Deleted!' });
}

async function deleteItems(req, res) {
    const { listId } = req.body;

    if (!listId) return res.status(400).json({ success: false, message: 'No Id found!' });
    if (typeof (listId) != typeof ([])) return res.status(400).json({ success: false, message: 'List must be array!' });

    for (let i = 0; i < listId.length; ++i) {
        const item = await Order.updateOne({ _id: listId[i] }, {
            $set: {
                delete: true,
            }
        });
    }

    return res.json({ success: true, message: 'Deleted!' });
}

async function packingItem(req, res) {
    const { _id } = req.params;

    await OrderLib.setPackingStatus(_id);

    return res.json({ success: true, message: 'Packing!' });
}

async function packingItems(req, res) {
    const { listId } = req.body;

    if (!listId) return res.status(400).json({ success: false, message: 'No Id found!' });
    if (typeof (listId) != typeof ([])) return res.status(400).json({ success: false, message: 'List must be array!' });

    for (let i = 0; i < listId.length; ++i) {
        await OrderLib.setPackingStatus(listId[i]);
    }

    return res.json({ success: true, message: 'Packing!' });
}

async function shippingItem(req, res) {
    const { _id } = req.params;

    await OrderLib.setShippingStatus(_id);

    return res.json({ success: true, message: 'Shipping!' });
}

async function shippingItems(req, res) {
    const { listId } = req.body;

    if (!listId) return res.status(400).json({ success: false, message: 'No Id found!' });
    if (typeof (listId) != typeof ([])) return res.status(400).json({ success: false, message: 'List must be array!' });

    for (let i = 0; i < listId.length; ++i) {
        await OrderLib.setShippingStatus(listId[i]);
    }

    return res.json({ success: true, message: 'Shipping!' });
}

async function doneItem(req, res) {
    const { _id } = req.params;

    await OrderLib.setDoneStatus(_id);

    return res.json({ success: true, message: 'Done!' });
}

async function doneItems(req, res) {
    const { listId } = req.body;

    if (!listId) return res.status(400).json({ success: false, message: 'No Id found!' });
    if (typeof (listId) != typeof ([])) return res.status(400).json({ success: false, message: 'List must be array!' });

    for (let i = 0; i < listId.length; ++i) {
        await OrderLib.setDoneStatus(listId[i]);
    }

    return res.json({ success: true, message: 'Done!' });
}

async function cancelItem(req, res) {
    const { _id } = req.params;

    const order = await Order.findOne({ _id });
    if (!order || order.status != 'new') return res.status(400).json({ success: false, message: 'Can not cancel order!' });

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

    await OrderLib.setCancelStatus(_id);

    return res.json({ success: true, message: 'Cancel!' });
}

async function cancelItems(req, res) {
    const { listId } = req.body;

    if (!listId) return res.status(400).json({ success: false, message: 'No Id found!' });
    if (typeof (listId) != typeof ([])) return res.status(400).json({ success: false, message: 'List must be array!' });

    for (let i = 0; i < listId.length; ++i) {
        const order = await Order.findOne({ _id: listId[i] });

        const cart = order.cart || [];
        for (let c = 0; c < cart.length; ++c) {
            const getCart = await Cart.findOne({ _id: cart[c] })
                .populate({
                    path: 'type',
                    populate: {
                        path: 'product',
                        model: Product
                    },
                });

            let productBack = getCart.type?.product?.return + getCart.amount;
            if (order?.status === 'new') productBack = getCart.type?.product?.return;

            await ProductInfo.updateOne({ _id: getCart.type?._id }, {
                $set: {
                    amount: getCart.type?.amount + getCart.amount,
                    sold: getCart.type?.sold - getCart.amount,
                }
            });

            await Product.updateOne({ _id: getCart?.type?.product?._id }, {
                $set: {
                    return: productBack,
                }
            });
        }

        await OrderLib.setCancelStatus(listId[i]);
    }

    return res.json({ success: true, message: 'Cancel!' });
}

async function hide(req, res) {
    const { _id } = req.params;

    const order = await Order.findOne({ _id });
    if (!order) return res.json({ success: false, message: 'Order not found!' });

    const item = await Order.updateOne({ _id }, {
        $set: {
            hide: !order.hide,
        }
    });

    return res.json({ success: true, message: 'Hid!' });
}

async function ipn(req, res) {
    const data = req.body.data;
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');

    try {
        const parsedData = JSON.parse(decodedData);
        const orderId = parsedData?.partnerReference?.order?.id;

        if (parsedData.transaction.status != 'success') {
            await Order.updateOne({ orderId }, {
                $set: {
                    status: 'cancel',
                }
            });
        }
        else {
            await Order.updateOne({ orderId }, {
                $set: {
                    status: 'packing',
                    paid: true,
                }
            });
        }
    } catch (error) {
        console.error('Error parsing JSON:', error.message);
    }

    return res.status(200).json({ status: 'ok' });
}

async function payWithAppota(req, res) {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId, status: 'new' });
    if (!order) return res.status(404).json({ success: false, message: 'NOT_FOUND_ORDER' });

    const TOKEN = JWT.sign({
        iss: process.env.PARTNER_CODE,
        jti: process.env.API_KEY + "-" + new Date().getTime(),
        api_key: process.env.API_KEY,
        exp: new Date().setHours(new Date().getHours() + 1)
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
    if (!jsonData?.data?.payment?.url) return res.status(403).json({ succes: false, message: 'CONNECT_ERROR' });

    return res.json({ succes: true, data: jsonData?.data?.payment?.url });
}

async function checkingPaymentProcess(req, res) {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'NOT_FOUND_ORDER' });

    const TOKEN = JWT.sign({
        iss: process.env.PARTNER_CODE,
        jti: process.env.API_KEY + "-" + new Date().getTime(),
        api_key: process.env.API_KEY,
        exp: new Date().setHours(new Date().getHours() + 1)
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
    if (!jsonData?.data) return res.status(403).json({ succes: false, message: 'CONNECT_ERROR' });

    return res.json({ succes: true, data: jsonData?.data });
}

async function deliveryFeeCalculator(req, res) {
    const { weight, price, provine, city } = req.body;
    const delivery_fee = await OrderLib.deliveryFeeCalculatator(weight, price, provine, city);

    return res.json({ success: true, data: delivery_fee });
}

module.exports = {
    add,
    list,
    info,
    deleteItem,
    hide,
    adminList,
    deleteItems,
    shippingItem,
    shippingItems,
    doneItem,
    doneItems,
    cancelItem,
    cancelItems,
    packingItem,
    packingItems,
    ipn,
    payWithAppota,
    checkingPaymentProcess,
    deliveryFeeCalculator,
}
