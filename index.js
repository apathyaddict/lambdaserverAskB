const serverless = require('serverless-http');
const cors = require('cors');
const express = require('express');
const searchController = require('./src/Controllers/getPricesApi');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/search', searchController.getPricesApi);

module.exports.handler = serverless(app);
