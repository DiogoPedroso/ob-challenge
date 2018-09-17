//IMPORT express
const express = require('express');
const csv = require('csv-express');
const app = express();
const winston = require('winston');
const morgan = require('morgan');
const debug = require('debug')('app:startup');

//require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
require('./startup/validation')();

//Check if there is an environment variable called PORT to assign it's port or use a default 3000 port
const port = process.env.PORT || 3000; 
const server = app.listen(port,  () => winston.info(`Listening on port ${port}...`));