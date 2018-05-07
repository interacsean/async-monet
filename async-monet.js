// @flow

/* eslint no-proto: 0 */
/* eslint no-extend-native: 0 */

import monet from 'monet';

export const extendMonads: Function = () => {
  monet.Either.fn.leftBind = function leftBind(fn: Function): mixed {
    return this.isLeft() ? fn(this.value) : this;
  };
  monet.Either.fn.leftFlatMap = monet.Either.fn.leftBind;

  monet.Either.fn.awaitMap = function awaitMap(fn: Function): mixed {
    return this.flatMap((val: mixed): mixed => {
      const result: mixed = fn(this.value || this.val);
      if (typeof result.then === 'function') {
        return new Promise((res: Function, rej: Function) => {
          result
            .then((resVal: mixed) => {
              res(this.of(resVal));
            })
            .catch((rejVal: mixed) => {
              rej(this.of(rejVal));
            });
        });
      }
      return this.of(result);
    });
  };
  monet.Maybe.fn.awaitMap = monet.Either.fn.awaitMap;

  monet.Either.fn.tap = function tap(fn: Function): mixed {
    return this.map((original: mixed): mixed => {
      fn(original);
      return original;
    });
  };
  monet.Maybe.fn.tap = monet.Either.fn.tap;
};

export const extendPromises: Function = () => {
  const mFuncs: Array<string> = [
    'map',
    'flatMap',
    'leftMap',
    'bind',
    'toEither',
    'toMaybe',
    'cata',
    'bimap',
    'left',
    'right',
    'isLeft',
    'isRight',
    'leftBind',
    'leftFlatMap',
    'awaitMap',
    'tap',
  ];

  mFuncs.forEach((mFunc: string) => {
    Promise.prototype[mFunc] = function mapPromiseMonadFn(...args: Array<mixed>): Promise<mixed> {
      return this.then((resVal: Object): mixed => {
        if (!resVal.__proto__[mFunc]) {
          throw new Error(`function ${mFunc} not defined in asyncMonet.`);
        }
        return resVal.__proto__[mFunc].apply(resVal, args);
      });
    };
  });
};

if (!monet.Either.fn.leftBind) {
  extendMonads();
}

if (!Promise.prototype.map) {
  extendPromises();
}
