const monet = require('monet');

// Create leftBind / leftFlatMap
monet.Either.fn.leftBind = function(fn) {
  return this.isLeft() ? fn(this.value) : this;
}
monet.Either.fn.leftFlatMap = monet.Either.fn.leftBind;

// map which awaits thenable value
monet.Either.fn.awaitMap = function (fn) {
  if (this.isRightValue) {
    const result = fn(this.value);
    if (typeof result.then === 'function') {
      return new Promise((res, rej) => {
        result
          .then(resVal => res(monet.Either.Right(resVal)))
          .catch(rejVal => rej(monet.Either.Right(rejVal)))
      })
    }
    return monet.Either.Right(result);
  }
  return this;
}

const mFuncs = [
  'map',
  'leftBind',
  'leftFlatMap',
  'awaitMap',
  'flatMap',
  'bind',
  'toEither',
  'toMaybe',
  'cata',
  'bimap',
  'left',
  'right',
  'isLeft',
  'isRight',
];

const MProm = function(promFn) {
  var prom = new Promise(promFn);
  this.then = (f) => prom.then(f);
  this.catch = (f) => prom.catch(f);
  mFuncs.forEach(mFunc => {
    this[mFunc] = function(...args) {
      return this.then((resVal) => resVal.__proto__[mFunc].apply(resVal, args));  
    };
  });
}
// MProm.prototype = Promise.prototype;

mFuncs.forEach(mFunc => {
  var oldFunc = monet.Either.fn[mFunc];
  monet.Either.fn[mFunc] = function(...args) {
    const r = oldFunc.apply(this, args);
    if (r.then && typeof r.then === 'function') {
      const mprom = new MProm((resolve, reject) => {
        r.then(resolve).catch(reject);
      });
      return mprom;
    }
    return r;
  }
})
// console.log(MProm, MProm.prototype);

module.exports = monet;
