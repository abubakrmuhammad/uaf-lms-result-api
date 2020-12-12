const express = require('express');
const morgan = require('morgan');

module.exports = (async function () {
  const scraper = await require('./scraper');

  const app = express();

  app.use(morgan('dev'));

  app.get('/result/:ag', async (req, res) => {
    const { ag } = req.params;
    const agRegex = /20\d{2}-ag-\d{4}/i;

    if (!agRegex.test(ag)) res.status(400).send('BAD REQUEST: Invalid ag number');

    const data = await scraper.getResult(req.params.ag);

    if (!data) res.status(404).send('RESULT NOT FOUND');
    res.status(200).json(data);
  });

  app.all('*', (req, res) => {
    res
      .status(404)
      .send(
        'UAF LMS Result Scrape API by Abubakr\nUse /result/:ag endpoint for results'
      );
  });

  return app;
})();
