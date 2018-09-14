const orderbooks = require('../routes/orderbooks');
const error = require('../middleware/error');
const express = require('express');
const helmet = require('helmet');

module.exports = function(app){
	//Adds middleware to allow JSON in the body of posts
	app.use(express.json());
	app.use(express.urlencoded({ extended:true }));
	app.use(helmet());
	app.use('/api/orderbooks', orderbooks);
	app.use(error);
}