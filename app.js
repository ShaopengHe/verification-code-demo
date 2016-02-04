const app = require('express')();
const bodyParser = require('body-parser');
const session = require('express-session');

const captcha = require('./captcha');

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret key'
}));

app.use('/captcha.jpg', captcha.codeImage());

app.get('/login', captcha.suspiciousRequest, captcha.verifyCode('code'),
  function(req, res) {
    res.send('ok');
});

app.use(function(err, req, res, next) {
  res.status(Math.floor(err.code / 100) || 500);
  res.send(err.message);
  next = null;
});

app.listen(port, function() {
  console.log(`Listening on Port: ${port}`);
});
