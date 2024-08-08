const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
// Functions to catch empty and invalid properties
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]){
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        })
    };
}

function priceIsValidNumber(req, res, next){
    const { data: { price }  = {} } = req.body;
    if (!price){
        return next({
            status: 400,
            message: `Dish must include a price`
        });
    } if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
  }
  
function dishExists (req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next ( {
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
}

function validateDishId(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id ${id} does not match route id ${dishId}.`,
        });
    }

    next();
}

// Implement the /dishes handlers needed to make the tests pass
// List Dishes - Get
function list(req, res){
    res.json({ data: dishes });
}

// Create Dish - Post
function create(req, res){
 const { data: { name, description, price, image_url } = {} } = req.body;
 const newDish = {
    id: nextId(),
    name, description, price, image_url
 };
 dishes.push(newDish);
 res.status(201).json( { data: newDish });
}

// Read Dish  - Get
function read(req, res) {
    res.json( { data: res.locals.dish });
}

// Update Dish - Put
function update(req, res){
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    res.json({ data: dish });
}

// Export completed modules
module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        create
        ], 
    read: [
        dishExists,
        read
        ],
    update: [
        dishExists,
        validateDishId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        update
    ],
    list,
}