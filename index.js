(async function () {
  const http = require('http');
  const app = await require('./app');

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  if (process.env.HEROKU_APP_NAME) {
    setInterval(() => {
      http.get(`http://${process.env.HEROKU_APP_NAME}.herokuapp.com/`);
    }, 1000 * 60 * 29);
  }
})();
