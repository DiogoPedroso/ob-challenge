const winston = require('winston');
require('express-async-errors');

module.exports = function(){
	process.on('uncaughtException', (err) => {
		new winston.transports.Console({ colorize: true, prettyPrint: true })
		new winston.transports.File({ filename: 'uncaughtExceptions.log' });		
	});

	process.on('unhandledRejection', (err) => {
		throw err;
	});

	winston.add(winston.transports.File, {filename: 'logfile.log'});
}