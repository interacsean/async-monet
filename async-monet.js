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

mFuncs.forEach(mFunc => {
  Promise.prototype[mFunc] = function(f) {
    return this.then((resVal) => resVal.__proto__[mFunc].call(resVal, f));  
  };
})

module.exports = monet;
