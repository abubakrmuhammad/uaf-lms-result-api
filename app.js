const express = require('express');
const morgan = require('morgan');

const scraper = require('./scraper');

const app = express();

app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('UAF LMS Result Scrape API: Use /result/:ag endpoint for results');
});

app.get('/result/:ag', async (req, res) => {
  const data = await scraper.getResult(req.params.ag);

  if (!data) res.status(500).send('SERVER ERROR');
  res.status(200).json(data);
});

module.exports = app;
