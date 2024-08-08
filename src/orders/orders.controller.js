const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
const validStatus = ['pending', 'preparing', 'preparing', 'out-for-delivery', 'delivered'];

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Functions to catch empty and invalid properties
function orderExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next( {
        status: 404,
        message: `Order id not found: ${orderId}`
    });
}
function bodyDataHas(propertyName){
    return function( req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        })
    }
}

function dishesNotEmpty(req, res, next){
    const { data: { dishes }  = {} } = req.body;
    if (!dishes){
        return next({
            status: 400,
            message: `Order must include a dish`
        })
    } if (!Array.isArray(dishes) || dishes.length <= 0){
        return next({
            status: 400,
            message: `Order must include atleast one dish`
        })
    }
    next();
}

function validateDishQuantity(req,res,next){
    const { data: { dishes }  = {} } = req.body;
    dishes.forEach((dish, index) => {
        if (dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({
                status: 400,
                message: `dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    });
    next();
}

function validateOrderId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;

    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. 
            Order: ${id}, Route: ${orderId}.`,
        });
    }

    next();
}

function validateStatus(req, res, next){
    const { data: { status }  = {} } = req.body;
    if(!status || !validStatus.includes(status)){
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        });
    } 
    next();
}

function validateDeliveredStatus(req, res, next){
    if (res.locals.order.status === 'delivered'){
        return next({
            status: 400,
            message: `A delivered order cannot be changed`
        });
    }
    next();
}


function validatePendingStatus(req, res, next){
    if (res.locals.order.status !== 'pending'){
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`
        });
    }
    next();
}


// Implement the /orders handlers needed to make the tests pass

// Create - Post
function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } ={} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json( { data: newOrder });
}

// Read - GET
function read(req, res) {
    res.json( { data: res.locals.order })
}

// Update - Put
function update(req, res){
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } ={} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json( { data: order });
}

// Delete - Delete
function destroy(req, res){
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deleteOrder = orders.splice(index, 1);
    res.sendStatus(204);
}

// List - GET
function list(req, res) {
    res.json({ data: orders });
}

//Export modules:
module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        dishesNotEmpty,
        validateDishQuantity,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        validateOrderId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        validateStatus,
        validateDeliveredStatus,
        dishesNotEmpty,
        validateDishQuantity,
        update
    ],
    delete: [
        orderExists,
        validatePendingStatus,
        destroy
    ],

}