const app = require('express')();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const Captcha = require('./captcha');

const captcha = new Captcha('login');
const otherCaptcha = new Captcha('other');

const port = process.env.PORT || 3000;

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret key'
}));

app.get('/otherCaptcha.png', otherCaptcha.codeImage({
  fontColor: 'red'
}));

app.get('/captcha.png', captcha.codeImage());

app.get('/login', captcha.suspiciousRequest(), function(req, res) {
  res.render('login', {
    title: 'demo',
    captcha: res.locals.captcha['login'].suspicious
  });
});

app.post('/login', captcha.suspiciousRequest(), captcha.verifyCode('code'),
  function(req, res) {
    if ((req.body.username === 'test') && (req.body.pw === 'passwd')) {
      return res.json('ok');
    }
    req.session.failed = req.session.failed || 0;
    req.session.failed++;
    res.redirect('/login');
});

app.use(function(err, req, res, next) {
  res.status(Math.floor(err.code / 100) || 500);
  res.send(err.message);
  console.error(err.stack);
  next = null;
});

app.listen(port, function() {
  console.log(`Listening on Port: ${port}`);
});
