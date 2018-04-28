const Monet = require('monet');

const l = console.log;


Monet.Either.fn.asyncFlatMap = async function(f) {
  if (this.isRightValue) {
    const r = await f(this.value);
    return r;
  } else {
    return this;
  }
}
Monet.Either.fn.awaitMap = function(f) {
  const r = this.map.call(this, f);
  console.log('am', r);
  return r;
}

l(Promise.prototype);

Promise.prototype.map = async function(f) {
  const r = await this;
  // l(r.__proto__);
  return r.__proto__.map.call(r, f);

  // if (r.isRightValue){
  //   return { isRightValue: true, value: f(r.value) };
  // } else {
  //   return r;
  // }
}
Promise.prototype.flatMap = async function(f) {
  const r = await this;
  return r.__proto__.flatMap.call(r, f);
  
  // if (r.isRightValue){
  //   return f(r.value);
  // } else {
  //   return r;
  // }
}

Promise.prototype.toEither = async function(f) {
  const r = await this;
  return r.__proto__.toEither.call(r, f);
  
  // if (r.isRightValue){
  //   return f(r.value);
  // } else {
  //   return r;
  // }
}

module.exports = Monet;