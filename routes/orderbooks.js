    //Require express
	const express = require('express');
	//Express Router variable
    const router = express.Router();
    //Require Mongoose
    const mongoose = require('mongoose');
    //Object decoupling
    const {Orderbook, createOrderbook, updateOrderbook} = require('../models/orderbook');
    //Require lodash
    const _ = require('lodash');
    const jsonexport = require('jsonexport');

    //Function that handles GET request on /api/orderbooks
    //Returns all the orderbooks in the database
	router.get('/', async (req, res)=>{
        //Queries for all the Orderbooks in the DB and awaits for the return
        const orderbooks = await Orderbook.find().sort('name');
        //Sends list to user
		res.send(orderbooks);
    });

    //Function that handles POST request on /
    //Function to create Orderbook
    //Returns the Orderbook values
    router.post('/', async(req,res) => {
        //Calls createOrderbook Function and passes the body of the request
        const orderbookObject = await createOrderbook(req.body);
        console.log(orderbookObject.coin_pairs);
        try{
            //Create new orderbook and save to database
            const orderbook = await new Orderbook(orderbookObject);
            //Save to database and return new orderbook
            await orderbook.save();

            let sortedCoinPairs = _.orderBy(orderbookObject.coin_pairs, ['coin_name'],['asc']);
                    
            sortedCoinPairs = _.map(sortedCoinPairs, function (c) {
                return _.omit(c, ['coin_price']);
            });

            jsonexport(sortedCoinPairs,{rename: ['Name', 'Trading Pair', 'Weight %', '€ Amount', 'Action'] }, function(err, csv){
                if(err) return console.log(err);
                res.set('Content-Type', 'text/csv');
                res.send(csv);
            });
		}catch(err){
			res.status(400).send(err.errors);
	}
    });
    
    //Function that handles the PUT request on /
    //Function that creates a new orderbook based the given ID parameter with the new index values
    //Returns a CSV with the updated values
	router.put('/:id', async (req, res) => {
        const orderbookObject = await Orderbook.findById(req.params.id);
        
        if(!orderbookObject) return res.status(404).send(`The orderbook with the given ID ${req.params.id} was not found`);
        
        try{
            //Save to database and return new orderbook
        
        let portfolio_changes = await updateOrderbook(orderbookObject, req.body.index.data.assets);

        const orderbook = await new Orderbook(portfolio_changes);
        await orderbook.save();

        let sortedCoinPairs = _.orderBy(portfolio_changes.coin_pairs, ['coin_name'],['asc']);
                    
        sortedCoinPairs = _.map(sortedCoinPairs, function (c) {
            return _.omit(c, ['coin_price']);
        });

        jsonexport(sortedCoinPairs, {rename: ['Name', 'Trading Pair', 'Weight %', '€ Amount', 'Action'] }, function(err, csv){
            if(err) return console.log(err);
            res.set('Content-Type', 'text/csv');
            res.send(csv);
        });
        }catch(err){
            //res.status(400).send(err.errors);
            console.log(err);
            return;
        }
    }
    );

    //Function that handles the DELETE request on 
    //Function to delete an orderbook with a give ID
    //Returns the deleted Orderbook
	router.delete('/:id', async (req, res) => {
        const orderbook = await Orderbook.findOneAndDelete(req.params.id);
        //If not send 404
        if(!orderbook) return res.status(404).send(`The orderbook with the given ID ${req.params.id} was not found`);
        //Response
        res.send(orderbook);
        }
    );

    //Function that handles GET request on /api/orderbooks/:id
    //Returns the orderbook in the database with a specified ID
    router.get('/:id', async (req,res)=>{
        Orderbook.findById(req.params.id, ['coin_pairs', '-_id'] , {lean : true},
        function (err, orderbook) {
        if(!orderbook){
                    res.status(404).send(`The orderbook with the given ID ${req.params.id} was not found`)
                }else{
                    let sortedCoinPairs = _.orderBy(orderbook.coin_pairs, ['coin_name'],['asc']);
                    
                    sortedCoinPairs = _.map(sortedCoinPairs, function (c) {
                        return _.omit(c, ['coin_price']);
                    });

                    jsonexport(sortedCoinPairs,{rename: ['Name', 'Trading Pair', 'Weight %', '€ Amount', 'Action'] }, function(err, csv){
                        if(err) return console.log(err);
                        res.set('Content-Type', 'text/csv');
                        res.send(csv);
                    });
                }
            }
         );
    }
);

module.exports = router;
    
