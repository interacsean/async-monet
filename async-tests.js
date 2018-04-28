const {
  Either,
  Maybe,
} = require('./async-monet');

const delay = (val, shouldRes = true) =>
  new Promise((res, rej) =>
    setTimeout(() =>
      shouldRes ? res(val) : rej(val), 500
    )
  );

const l = console.log;

const getEither = (v, r = true) =>
  r ? Either.Right(v) : Either.Left(v);

const getMaybe = (v, r = true) =>
  r ? Maybe.Just(v) : Maybe.None();

(async () => {
  const e = await getMaybe(20)
    .flatMap(a => {
      l(a)
      return delay(getMaybe(a + 1))
    })
    .map(a => {
      console.log('1. should only run on resolved right', a);
      return delay(a + 1)
    })
    .map(async ap => {
      const a = await ap;
      console.log("2. don't think there's a way this will ever wait", a);
      return a+1;
    })
    .flatMap(async ap => {
      const a = await ap;
      console.log(a);
      return delay(getMaybe(a + 1, false))
    })
    .toEither('bad')
    .cata(
      l => {
        console.log(l);
        return l+l;
      },
      r => {
        console.log(r);
        return r+r;
      }
    );
  console.log('result: ', e);
})();