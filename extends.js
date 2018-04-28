const { Either } = require('monet');

const AsyncEither = {}

const AsyncEitherProto = {
  awaitMap: async (f) => {
    if (this.isRightValue && typeof this.value.then === 'function') {
      await this.value;
      return this.map(f);
    } else {
      return f(this.value);
    }
  },
  Right = function (val) {
    return new AsyncEither.fn.init(val, true)
};
var Left = Either.Left = root.Left = function (val) {
    return new AsyncEither.fn.init(val, false)
};
}
Object.setPrototypeOf(AsyncEitherProto, Either);
Object.setPrototypeOf(AsyncEither, AsyncEitherProto);

module.exports = {
  AsyncEither,
  AsyncEitherProto,
}