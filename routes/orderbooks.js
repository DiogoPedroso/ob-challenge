	//Require express
	const express = require('express');
	//Express Router variable
    const router = express.Router();
    //Require Mongoose
    const mongoose = require('mongoose');
    //Object decoupling
    const {Orderbook, createOrderbook, rebalanceOrderbook} = require('../models/orderbook');
    //Require lodash
    const _ = require('lodash');
    const csv = require('csv-express');
    const jsonexport = require('jsonexport');

    //Function that handles GET request on /api/orderbooks
	router.get('/', async (req, res)=>{
        //Queries for all the Orderbooks in the DB and awaits for the return
        const orderbooks = await Orderbook.find().sort('name');
        //Sends list to user
		res.send(orderbooks);
    });

    //Function that handles POST request on /api/orderbooks
    router.post('/', async(req,res) => {
        const orderbookObject = await createOrderbook(req.body);

        try{
            const orderbook = await  new Orderbook(orderbookObject);
            await orderbook.save();
			res.send(orderbook);	
		}catch(err){
			res.status(400).send(err.errors);
	}
    });
    
    //Update OrderbookBook
	router.put('/:id', async (req, res) => {
        /*const orderbook = await Orderbook.findByIdAndUpdate(req.params.id, { 
            fundAmount: req.body.fundAmount, 
            coin_pairs: req.body.coin_pairs
        }, {new : true});*/
        //If not send 404
        const orderbook = await Orderbook.findById(req.params.id);
        if(!orderbook) return res.status(404).send(`The orderbook with the given ID ${req.params.id} was not found`);

        await rebalanceOrderbook(orderbook, req.body.index.data.assets);

        res.send(orderbook);
        }
    );

    //Delete Request Orderbook
	router.delete('/:id', async (req, res) => {
        const orderbook = await Orderbook.findOneAndDelete(req.params.id);
        //If not send 404
        if(!orderbook) return res.status(404).send(`The orderbook with the given ID ${req.params.id} was not found`);
        //Response
        res.send(orderbook);
        }
    );

    //GET Request for specific ID
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
    
