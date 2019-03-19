
const monet = require("monet");

const monadFns = [
  "map",
  "awaitMap",
  "flatMap",
  "bind",
  "tap",
  "fromPromise",
  "cata",
];

const monetMonads = {
  Maybe: [
    ...monadFns,
    "toEither",
    "leftBind",
  ],
  Either: [
    ...monadFns,
    "leftBind",
    "leftMap",
    "leftFlatMap",
    "toMaybe",
    "bimap",
  ]
};

// function MonadicPromise(prom) {
//   this.prom = prom;
//   this.then = prom.then.bind(this.prom);
//   this.catch = prom.catch.bind(this.prom);
//   this.promise = () => this.prom;
// }

// function PEither(prom) {
//   MonadicPromise.call(this, prom);
// }
// PEither.prototype = Object.create(MonadicPromise.prototype);
// PEither.prototype.constructor = PEither;

// function PMaybe(prom) {
//   MonadicPromise.call(this, prom);
// }
// PMaybe.prototype = Object.create(MonadicPromise.prototype);
// PMaybe.prototype.constructor = PMaybe;

monet.extendMonet = function extendMonet(useMonadicPromises = false) {
  // leftBind/leftFlatMap, which flatMaps in left/none conditions
  monet.Either.fn.leftBind = function leftBind(fn) {
    return this.isLeft() ? fn(this.value) : this;
  };
  monet.Either.fn.leftFlatMap = monet.Either.fn.leftBind;

  // leftBind/leftFlatMap, which flatMaps in left/none conditions
  monet.Maybe.fn.leftBind = function leftBind(fn) {
    return this.isNone() ? fn(this.value) : this;
  };
  monet.Maybe.fn.leftFlatMap = monet.Maybe.fn.leftBind;

  // tap, which takes a right value but returns original unmodified value
  monet.Either.fn.tap = function tap(fn) {
    return this.map((original) => {
      fn(original);
      return original;
    });
  };
  monet.Maybe.fn.tap = monet.Either.fn.tap;

  // // flipMap, which maps but converts Left to Right, None to Some, and vica versa.
  monet.Maybe.fn.flip = function flip(someValue) {
    return this.cata(() => monet.Some(someValue), monet.None);
  };
  monet.Either.fn.flip = function flip() {
    return this.cata(monet.Right, monet.Left);
  };

  // map, which awaits thenable value
  monet.Either.fn.awaitMap = function (fn) {
    if (this.isRightValue) {
      const result = fn(this.value);
      if (typeof result.then === "function") {
        return new Promise((res, rej) => {
          result
            .then(v => res(monet.Either.Right(v)))
            .catch(e => res(monet.Either.Left(e)));
        });
      }
      return Promise.resolve(monet.Either.Right(result));
    }
    return Promise.resolve(this);
  };
  monet.Maybe.fn.awaitMap = function (fn) {
    if (this.isValue) {
      const result = fn(this.value);
      if (typeof result.then === "function") {
        return new Promise((res, rej) => {
          result
            .then(v => res(monet.Maybe.Some(v)))
            .catch(e => res(monet.Maybe.None()));
        });
      }
      return Promise.resolve(monet.Maybe.Some(result));
    }
    return Promise.resolve(this);
  };

  // fromPromise, errors (catch) go to Left
  monet.Either.fromPromise = function fromPromise(prom) {
    return prom.then(monet.Either.Right).catch(monet.Either.Left);
  };
  monet.Maybe.fromPromise = function fromPromise(prom) {
    return prom.then(monet.Maybe.Some).catch(monet.Maybe.None);
  };

  // init
  monet.Either.init = function init(isRight, val, rightVal) {
    return isRight
      ? monet.Either.Right(rightVal !== undefined ? rightVal : val)
      : monet.Either.Left(val);
  };
  monet.Maybe.init = function init(isVal, val = null) {
    return isVal ? monet.Some(val) : monet.None();
  };
  
  if (useMonadicPromises) {
    // PEither.fn = PEither.prototype;
    // Object.keys(monet.Either.prototype).forEach(protFn => {
    //   Promise.prototype[protFn] = monet.Either.prototype[protFn]; // .bind(PEither.fn);
    //   // eval("PEither.prototype[protFn] = "+monet.Either.prototype[protFn].toString());
    // });
    // PEither.fn.init = function (val, isRightValue) {
    //   this.isRightValue = isRightValue;
    //   this.value = val;
    // },
    // PEither.fn.init.prototype = PEither.fn;

    // PEither.Right = PEither.of = function (val) {
    //   return new PEither.fn.init(val, true);
    // };
    // PEither.Left = function (val) {
    //   return new PEither.fn.init(val, false);
    // };

    // // todo
    // monet.PMaybe = {};
    // monet.PMaybe.prototype = monet.Maybe;
    // monet.PMaybe.fn = monet.PMaybe.prototype;

    // const PMonads = {
    //   Either: PEither,
    //   Maybe: PMaybe,
    // };

    function ucfirst(s) { return s[0].toUpperCase() + s.substr(1); }

    Object.keys(monetMonads).forEach((monad) => {
      monetMonads[monad].forEach((monadicFn) => {
        // alias functions, which will be typed to return a Promise
        monet[monad].prototype["async" + ucfirst(monadicFn)] = monet[monad].prototype[monadicFn];
        Promise.prototype[monadicFn] =
        Promise.prototype["async" + ucfirst(monadicFn)] =
          function anonFunctor(...args) {
            return this.then((resVal) => resVal[monadicFn].call(resVal, ...args));
          };

        // if (monet[monad].fn[monadicFn] !== undefined) {
        //   const oldFunc = monet[monad].fn[monadicFn];
        //   monet[monad].fn[monadicFn] = function anonFunctor(...args: any[]) {
        //     const result = oldFunc.call(this, ...args);
        //     return (result || {}).then && typeof result.then === "function"
        //       ?  new Promise(result)
        //       : result;
        //   };
        // }
      });
    });

    // console.log(PEither.fn.map === monet.Either.fn.map);
    // console.log('broo');
    // console.log(Object.keys(PEither));
  }
};

module.exports = monet;
