const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');

const orderbookSchema = new mongoose.Schema({
    fundAmount: {
        type: Number,
        required: true
    },
    coin_pairs: [{
        _id: false, 
        id: false, 
        coin_name: {
            type: String,
            required: true,
        },
        trading_pair:{
            type: String,
            required: true
        },
        weight:{
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        coin_price: {
            type: Number,
            required: true
        }
    }]
})

const Orderbook = mongoose.model('Orderbook', orderbookSchema);

async function createOrderbook(json){
    
    const coin_pairs = [];
    //Grab JSON from Body
    //Calculate Values
    //Create Orderbook
    //return orderbook

    for (const key in json.index.data.assets){
        const coin_pair = {
            coin_name: key,
            trading_pair: "EUR/" + key,
            weight: json.index.data.assets[key].weight,
            amount: json.index.data.assets[key].weight * json.fundAmount,
            action: "BUY",
            coin_price: json.index.data.assets[key].price
        };
        coin_pairs.push(coin_pair);
    };

    const orderbook = {
        fundAmount: json.fundAmount, 
        coin_pairs: coin_pairs
    }

    return orderbook;
}

async function rebalance(orderbook, updated_index){
    let fundAmount = 0;
    let updated_values = [];
    let current_price_value = 0;

    for (const key in updated_index){
        const orderbook_coin = _.find(orderbook.coin_pairs, ['coin_name', key]);
        
        const current_price = (((updated_index[key].price - orderbook_coin.coin_price) / orderbook_coin.coin_price) * orderbook_coin.amount) + orderbook_coin.amount;
        updated_values.push({
            coin_name: key,
            symbol: key,
            weight: updated_index[key].weight,
            rebalanceAmount: 0,
            current_price: current_price,
            order_required: 0,
            action: 'BUY'
        }),
        fundAmount += current_price;
        current_price_value += updated_index[key].price;

        }

    //Rebalance Values
    for (let i = 0;  i < updated_values.length; i++){
        updated_values[i].rebalanceAmount = fundAmount * updated_values[i].weight;
        updated_values[i].order_required = updated_values[i].rebalanceAmount - updated_values[i].current_price;
        if(order_required < 0) updated_values[i].action = 'SELL'
    }

    
    let buy_array = _.filter(updated_values, ['action', 'BUY']);
    let sell_array = _.filter(updated_values, ['action', 'SELL']);

    //TODO: 
    //Iterate over sell_array until the end
    //Iterate over buy_array 
    //Check order required
    //Sum order_required[buy] with order_required[sell]
    //Create new Trading Pair
    //Advance buy_array until sell_array[X].order_required = 0 or buy_array is finished
    let buy_array_counter = 0;
    for(var updated_value in updated_values){
        while(buy_array_counter < buy_array.length){
            amount = buy_array[buy_array_counter] + updated_value.order_required;
            
            buy_array_counter++;
        }
    }
}

module.exports.Orderbook = Orderbook;
module.exports.createOrderbook = createOrderbook;
module.exports.rebalanceOrderbook = rebalance;
