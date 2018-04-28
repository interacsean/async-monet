const monet = require('monet');

monet.Either.fn.prototype.leftBind = monet.Either.fn.prototype.leftFlatMap = function(fn) {
  return this.isLeft() ? fn(this.value) : this;
}

Promise.prototype.map = async function(f) {
  const r = await this;
  return r.__proto__.map.call(r, f);
}

Promise.prototype.flatMap = async function(f) {
  const r = await this;
  return r.__proto__.flatMap.call(r, f);
}
Promise.prototype.bind = Promise.prototype.flatMap;

Promise.prototype.toEither = async function(f) {
  const r = await this;
  return r.__proto__.toEither.call(r, f);
}

Promise.prototype.toMaybe = async function() {
  const r = await this;
  return r.__proto__.toMaybe.call(r);
}

Promise.prototype.cata = async function(fl, fr) {
  const r = await this;
  return r.__proto__.cata.call(r, fl, fr);
}

Promise.prototype.bimap = async function(fl, fr) {
  const r = await this;
  return r.__proto__.bimap.call(r, fl, fr);
}

Promise.prototype.left = async function() {
  const r = await this;
  return r.__proto__.left.call(r);
}

Promise.prototype.right = async function() {
  const r = await this;
  return r.__proto__.right.call(r);
}

Promise.prototype.isLeft = async function() {
  const r = await this;
  return r.__proto__.isLeft.call(r);
}

Promise.prototype.isRight = async function() {
  const r = await this;
  return r.__proto__.isRight.call(r);
}



module.exports = monet;
