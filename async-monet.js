
const monet = require('monet');

const monadFns = [
  'map',
  'awaitMap',
  'flatMap',
  'bind',
  'tap',
  'fromPromise',
];

const monetMonads = {
  Maybe: [
    ...monadFns,
    'toEither',
  ],
  Either: [
    ...monadFns,
    'leftBind',
    'leftMap',
    'leftFlatMap',
    'toMaybe',
    'bimap',
  ]
}

function MonadicPromise(prom) {
  this.prom = prom;
  this.then = prom.then.bind(this.prom);
  this.catch = prom.catch.bind(this.prom);
  this.promise = () => this.prom;
}

function PEither(prom) {
  MonadicPromise.call(this, prom);
}
PEither.prototype = Object.create(MonadicPromise.prototype);
PEither.prototype.constructor = PEither;

function PMaybe(prom) {
  MonadicPromise.call(this, prom);
}
PMaybe.prototype = Object.create(MonadicPromise.prototype);
PMaybe.prototype.constructor = PMaybe;

monet.extendMonet = function extendMonet(useMonadicPromises = false) {
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
            .then(monet.Either.Right(resVal))
            .catch(monet.Either.Right(rejVal))
        });
      }
      return Promise.resolve(monet.Either.Right(result));
    }
    return Promise.resolve(this);
  }  

  // fromPromise, errors (catch) go to Left
  monet.Either.fn.fromPromise = function fromPromise(prom) {
    return Promise.then(monet.Either.Right).catch(monet.Either.Left);
  };
  monet.Maybe.fn.fromPromise = function fromPromise(prom) {
    return Promise.then(monet.Maybe.Some).catch(monet.Maybe.None);
  };

  if (useMonadicPromises) {
    PEither.fn = PEither.prototype;
    Object.keys(monet.Either.prototype).forEach(protFn => {
      PEither.prototype[protFn] = monet.Either.prototype[protFn];//.bind(PEither.fn);
      // eval("PEither.prototype[protFn] = "+monet.Either.prototype[protFn].toString());
    });
    PEither.fn.init = function (val, isRightValue) {
      this.isRightValue = isRightValue
      this.value = val
    },
    PEither.fn.init.prototype = PEither.fn;
    
    PEither.Right = PEither.of = function (val) {
      return new PEither.fn.init(val, true);
    };
    PEither.Left = function (val) {
      return new PEither.fn.init(val, false);
    };
    
    // todo
    monet.PMaybe = {};
    monet.PMaybe.prototype = monet.Maybe;
    monet.PMaybe.fn = monet.PMaybe.prototype;
    
    const PMonads = {
      Either: PEither,
      Maybe: PMaybe,
    }

    Object.keys(monetMonads).forEach(monad => {
      monetMonads[monad].forEach(monadicFn => {
        // PMonads[monad].prototype[monadicFn] =
        //   function anonFunctor(...args) {
        //     return !this.prom ? this[monadicFn].call(this, ...args) : new PMonads[monad](this.prom.then((resVal) =>
        //       resVal[monadicFn].call(resVal, ...args)));
        //   };

        if (monet['P'+monad].fn[monadicFn] !== undefined) {
          const oldFunc = monet['P'+monad].fn[monadicFn];
          monet['P'+monad].fn[monadicFn] = function anonFunctor(...args) {
            const result = oldFunc.call(this, ...args);
            return (result || {}).then && typeof result.then === 'function'
              ?  new PMonads[monad](result)
              : result;
          };
        }
      });
    });

    // console.log(PEither.fn.map === monet.Either.fn.map);
    // console.log('broo');
    // console.log(Object.keys(PEither));
  }
}

monet.PEither = PEither;
monet.PMaybe = PMaybe;
module.exports = monet;
