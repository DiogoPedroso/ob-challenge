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

        const orderbookObject = {
            fundAmount: json.fundAmount, 
            coin_pairs: coin_pairs
        };

        return orderbookObject;
}

//Function that generates the changes based on a received index
async function update(orderbook, updated_index){
    //New total fund amount
    let fundAmount = 0;
    //Array that will carry the updated values
    let updated_values = [];

    //Iterate over update list of coins and create an array with the updated values
    for (const key in updated_index){
        //Searches for the corresponding coin pair from the old Orderbook
        const orderbook_coin = _.find(orderbook.coin_pairs, ['coin_name', key]);
        
        //Calculates the current price based on percentage of increase/decrease compared to the old orderbook value
        const current_price = (((updated_index[key].price - orderbook_coin.coin_price) / orderbook_coin.coin_price) * orderbook_coin.amount) + orderbook_coin.amount;
        //Adds to updated values Array
        updated_values.push({
            coin_name: key,
            symbol: key,
            weight: updated_index[key].weight,
            rebalanceAmount: 0,
            current_price: current_price,
            order_required: 0,
            action: 'BUY',
            price: orderbook_coin.coin_price
        }),
        //Increase fund amount based on updated current value
        fundAmount += current_price;
        }

    //Iterate over updated values
    for (let i = 0;  i < updated_values.length; i++){
        //Set rebalanced amount based on new fund amount
        updated_values[i].rebalanceAmount = fundAmount * updated_values[i].weight;
        //Calculate order required based on rebalanced amount and current price
        updated_values[i].order_required = updated_values[i].rebalanceAmount - updated_values[i].current_price;
        //If order required is less than zero then set action to sell
        if(updated_values[i].order_required < 0) updated_values[i].action = 'SELL'
    }

    return await rebalance(fundAmount, updated_values);
}

//Not fully working
//Function to create coin pairs for rebalancing
async function rebalance(fundAmount, updated_values){
    //Array to hold a copy of updated_values
    let updated_values_copy = updated_values.slice();
    //Array that holds the 
    let rebalance_coin_pairs = [];
    //Array for the coins that need to be bought
    let buy_array = _.filter(updated_values_copy, ['action', 'BUY']);
    //Array for the coins that can be sold
    let sell_array = _.filter(updated_values_copy, ['action', 'SELL']);

    //Counter for the buy array
    let buy_array_counter = 0;    
    //Iterate over sell array items until the end
    for(let sell_coin of sell_array){
        //Iterate over buy_array
        while(buy_array_counter < buy_array.length){
            //Calculates the amount that can be sold from the sell coin to the buy coin
            amount = buy_array[buy_array_counter].order_required + sell_coin.order_required;
            if(amount === 0){
               //create new pair with amount value
               const coin_pair = {
                    coin_name: buy_array[buy_array_counter].symbol,
                    trading_pair: sell_coin.symbol + "/" + buy_array[buy_array_counter].symbol,
                    weight: buy_array[buy_array_counter].weight,
                    //Amount is the total order_required
                    amount: buy_array[buy_array_counter].order_required,
                    action: "BUY",
                    coin_price: buy_array[buy_array_counter].price
               };
               //push to array
               rebalance_coin_pairs.push(coin_pair);
               //order required for buy coin is 0
               buy_array[buy_array_counter].order_required = 0;
               //order required for sell coin is 0
               sell_coin.order_required = 0;
               //Advance buy array counter to next buy coin
               buy_array_counter++;
               //Break to Advance to next sell coin
               break;
            }else if(amount < 0){
                
                const coin_pair = {
                    coin_name: buy_array[buy_array_counter].symbol,
                    trading_pair: sell_coin.symbol + "/" + buy_array[buy_array_counter].symbol,
                    weight: buy_array[buy_array_counter].weight,
                    //Amount is the total buy order required
                    amount: buy_array[buy_array_counter].order_required,
                    action: "BUY",
                    coin_price: buy_array[buy_array_counter].price
               };
                //push to array
                rebalance_coin_pairs.push(coin_pair);
                //order required for buy coin is 0
                buy_array[buy_array_counter].order_required = 0;
                //Order required for sell coin is now the remaing amount
                sell_coin.order_required = amount;
                //Advance buy array counter to next buy coin
                buy_array_counter++;
            }
            else if(amount > 0){
                const coin_pair = {
                    coin_name: buy_array[buy_array_counter].symbol,
                    trading_pair: sell_coin.symbol + "/" + buy_array[buy_array_counter].symbol,
                    weight: buy_array[buy_array_counter].weight,
                    //Amount is the absolute of the total sell order
                    amount: Math.abs(sell_coin.order_required),
                    action: "BUY",
                    coin_price: buy_array[buy_array_counter].price
                };
                //push to array
                rebalance_coin_pairs.push(coin_pair);
                //Set new order required to the remaining amount
                buy_array[buy_array_counter].order_required = amount;
                //Set sell coin order required to 0
                sell_coin.order_required = 0;
                //Break for next sell coin
                break;
            }
        }
        //To avoid unnecessary processing a break command for cases where the sell array is bigger than the buy array a break is issued 
        if(buy_array_counter === buy_array.length) break;
    }

    //Iterate over updated values and create coin pairs with amount equals current price index + order required
    //push to rebalance_coin_pairs
    //Create orderbook object with all the rebalanced coins and new fund amount

    for(let updated_value_copy of updated_values_copy ){
        const coin_pair = {
            coin_name: updated_value_copy.symbol,
            trading_pair: "EUR/" + updated_value_copy.symbol,
            weight: updated_value_copy.weight,
            //Amount is the absolute of the total sell order
            amount: updated_value_copy.current_price + updated_value_copy.order_required,
            action: "BUY",
            coin_price: updated_value_copy.price
        };
        rebalance_coin_pairs.push(coin_pair);
    }

    const orderbookObject = {
        fundAmount: fundAmount, 
        coin_pairs: rebalance_coin_pairs
    }

    return orderbookObject;
}

module.exports.Orderbook = Orderbook;
module.exports.createOrderbook = createOrderbook;
module.exports.updateOrderbook = update;
