'use strict';
const _ = require('underscore');
const Canvas = require('canvas');

function randomCode(len, charSet) {
  // 默认忽略l, 1, I, 0, O, o易混淆字符
  charSet = charSet || 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  len = len || 4;
  var code = '';
  for (let i = 0; i < len; i++) {
    code += charSet[Math.floor((Math.random() * charSet.length))];
  }
  return code;
}

/**
 * 使用canvas画出验证码
 * @param {String} code
 * @param {Object} params
 * @return {Canvas} canvas
 */
function paintImage(code, params) {
  var canvas = new Canvas(params.width, params.height);
  var ctx = canvas.getContext('2d');

  // background color
  ctx.fillStyle = params.background;
  ctx.fillRect(0, 0, params.width, params.height);

  // font
  ctx.font = `${params.fontSize}px ${params.fontFamily}`;

  // font width & height
  var totalWidth = ctx.measureText(code).width;
  var fontHeight = totalWidth / code.length;
  var fontWidth = fontHeight;

  // 居中
  var startX = Math.ceil((params.width - totalWidth) * 0.5);
  var startY = Math.ceil((params.height + fontHeight) * 0.5);

  // code
  ctx.fillStyle = params.fontColor;
  for (let i = 0; i < code.length; i++) {
    let c = Math.random() * 2 * params.transform - params.transform;
    ctx.setTransform(1, 0, c, 1, c * params.height * -0.5, 0);
    ctx.fillText(code.charAt(i), startX + fontWidth * i, startY);
  }

  // curve
  for (let i = 0; i < params.curveNum; i++) {
    ctx.antialias = 'none';
    ctx.strokeStyle = params.curveColor;
    ctx.moveTo(Math.random() * params.width, Math.random() * params.height);
    ctx.bezierCurveTo(
      Math.random() * params.width, Math.random() * params.height,
      Math.random() * params.width, Math.random() * params.height,
      Math.random() * params.width, Math.random() * params.height
    );
    ctx.stroke();
  }

  return canvas;
}

/*********************** exports functions ************************/

/**
 * 返回验证码图片中间件
 * @param {Object} [options]
 * @param {Number} [options.codeLength=4] 验证码长度
 * @param {Number} [options.width=100] 图片宽度
 * @param {Number} [options.height=50] 图片高度
 * @param {String} [options.background=#fff] 背景颜色
 * @param {Number} [options.fontSize=30] 字体大小
 * @param {String} [options.fontFamily=Courier New] 字体类型
 * @param {String} [options.fontColor=#000] 字体颜色
 * @param {Number} [options.transform=0.5] 字体旋转系数（0～1）
 * @param {Number} [options.curveNum=2] 干扰曲线数量
 * @param {String} [options.curveColor=rgba(100,100,100,0.6)] 曲线颜色
 * @return {Function} fn(req, res) {}
 */
exports.codeImage = function(options) {
  var params = _.defaults(options || {}, {
    codeLength: 4,
    width: 100,
    height: 50,
    background: '#fff',

    fontSize: 30,
    fontFamily: 'Courier New',
    fontColor: '#000',
    transform: 0.5,

    curveNum: 2,
    curveColor: 'rgba(100,100,100,0.6)'
  });

  return function(req, res) {
    var code = randomCode(params.codeLength);
    var canvas = paintImage(code, params);
    req.session.captcha = code;
    res.type('png');
    res.header('Cache-Control', 'no-store, max-age=0');
    canvas.pngStream().pipe(res);
  };
};

/**
 * 销毁Session中的验证码
 * @param {Request} req
 */
exports.destroyCode = function(req) {
  req.session.captcha = undefined;
};

/**
 * 判断该请求是否异常而需要验证码
 * 结果保存在res.locals.captcha.suspicious
 * @TODO
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
exports.suspiciousRequest = function(req, res, next) {
  res.locals.captcha = res.locals.captcha || {};
  res.locals.captcha.suspicious = req.session.failed > 2;
  return next();
};

/**
 * 验证captcha code是否正确
 * 从req.body和req.query读取验证码与Session中的验证码进行对比
 * 每次对比后，无论是否相等，Session中的验证码都被销毁
 * @param {String} fieldName 验证码的请求参数名
 * @return {Function} middleware
 */
exports.verifyCode = function(fieldName) {
  return function(req, res, next) {
    if (!res.locals.captcha || !res.locals.captcha.suspicious) {
      return next();
    }

    // 每次验证都销毁原有验证码
    let captcha = req.session.captcha;
    exports.destroyCode(req);

    let code = req.body[fieldName] || req.query[fieldName] || '';
    if (!code) {
      let error = new Error('Captcha: code not found');
      error.code = 40101;
      return next(error);
    }

    if (!captcha || (captcha.toLowerCase() !== code.toLowerCase())) {
      let error = new Error('Captcha: code is wrong');
      error.code = 40102;
      return next(error);
    }
    return next();
  };
};
