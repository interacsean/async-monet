const monet = require('monet');

monet.extendMonet = function extendMonet() {
  // leftBind/leftFlatMap, which flatMaps in left/none conditions
  monet.Either.fn.leftBind = function leftBind(fn) {
    return this.isLeft() ? fn(this.value) : this;
  };
  monet.Either.fn.leftFlatMap = monet.Either.fn.leftBind;

  // tap, which takes a right value but returns original unmodified value
  monet.Either.fn.tap = function tap(fn) {
    return this.map((original) => {
      fn(original);
      return original;
    });
  };
  monet.Maybe.fn.tap = monet.Either.fn.tap;
  
  // fromPromise, errors (catch) go to None
  monet.Maybe.fn.fromPromise = function fromPromise(prom) {
    return Promise.then(monet.Maybe.of).catch(monet.Maybe.None);
  };

  // // flipMap, which maps but converts Left to Right, None to Some, and vica versa.
  monet.Maybe.fn.flip = function flip(someValue) {
    return this.cata(() => monet.Some(someValue), monet.None);
  }
  monet.Either.fn.flip = function flip() {
    return this.cata(monet.Right, monet.Left);
  }

  // map, which awaits thenable value
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

  // fromPromise, errors (catch) go to Left
  monet.Either.fn.fromPromise = function fromPromise(prom) {
    return Promise.then(monet.Either.Right).catch(monet.Either.Left);
  };
}

const monadicFns = [
  'map',
  'leftBind',
  'leftMap',
  'leftFlatMap',
  'awaitMap',
  'flatMap',
  'bind',
  'toEither',
  'toMaybe',
  'cata',
  'bimap',
  'tap',
  'fromPromise',
];

const monetMonads = [
  'Maybe',
  'Either',
];

monet.returnMonadicPromises = function returnMonadicPromises() {
  function MonadicPromise(prom) {
    this.prom = prom;
    this.then = prom.then.bind(this.prom);
    this.catch = prom.catch.bind(this.prom);
  }
  
  monadicFns.forEach(monadicFn => {
    MonadicPromise.prototype[monadicFn] =
      function anonFunctor(...args) {
        return new MonadicPromise(this.prom.then((resVal) =>
          resVal[monadicFn].call(resVal, ...args)));
      };
  });

  monetMonads.forEach(monad => {
    monadicFns.forEach(monadicFn => {
      if (monet[monad].fn[monadicFn] !== undefined) {
        const oldFunc = monet[monad].fn[monadicFn];
        monet[monad].fn[monadicFn] = function anonFunctor(...args) {
          const result = oldFunc.call(this, ...args);
          return (result || {}).then && typeof result.then === 'function'
            ? new MonadicPromise(result)
            : result;
        };
      }
    });
  });
}

module.exports = monet;
