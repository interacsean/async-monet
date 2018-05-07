require('../async-monet');
const {
  Either,
  Maybe,
} = require('monet');

const delay = (val, shouldRes = true) => new Promise((res, rej) =>
  setTimeout(() => shouldRes ? res(val) : rej(val), 500));

describe('Async Monads', () => {
  describe('Standard Either', () => {
    it('Can still map synchronously (as per original monet)', async (done) => {
      const either = Either.Right('value');

      const result = either
        .map(val => `${val} mapped`)
        .map(val => `${val} twice`);

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value mapped twice');

      done();
    });

    it('Can still flatMap syncronously', () => {
      const either = Either.Right('value');

      const result = either
        .flatMap(val => Either.Right(`${val} flatMapped`))
        .flatMap(val => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');
    });
  });

  describe('Async Either', () => {
    it('Can map asynchronously', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .awaitMap(val => delay(`${val} mapped`))
        .awaitMap(val => delay(`${val} twice`));

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value mapped twice');

      done();
    });

    it('Map asynchronously is bypassed on left', async (done) => {
      const either = Either.Left('value');

      const result = await either
        .awaitMap(val => delay(`${val} mapped`))
        .awaitMap(val => delay(`${val} twice`));

      expect(result.isLeft()).toBe(true);
      expect(result.left()).toEqual('value');

      done();
    });

    it('Can flatMap asynchronously', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap(val => delay(Either.Right(`${val} flatMapped`)))
        .flatMap(val => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');

      done();
    });

    it('flatMap bypasses left', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap(val => delay(Either.Left(`${val} flatMapped once`)))
        .flatMap(val => `${val} not twice`);

      expect(result.isLeft()).toBe(true);
      expect(result.left()).toEqual('value flatMapped once');

      done();
    });
  });

  describe('Either left bind', () => {
    it('binds on lefts', async (done) => {
      const either = Either.Left('value');

      const result = await either
        .leftBind(val => delay(Either.Left(`${val} leftBound`)))
        .leftFlatMap(val => `${val} twice`);

      expect(result).toEqual('value leftBound twice');

      done();
    });

    it('does not bind on rights', async (done) => {
      const either = Either.Left('value');

      const result = await either
        .leftBind(val => delay(Either.Right(`${val} leftBound once`)))
        .leftFlatMap(val => `${val} not twice`);

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value leftBound once');

      done();
    });
  });

  describe('Standard Maybe', () => {
    it('Can still map synchronously (as per original monet)', async (done) => {
      const maybe = Maybe.Some('value');

      const result = maybe
        .map(val => `${val} mapped`)
        .map(val => `${val} twice`);

      expect(result.isSome()).toBe(true);
      expect(result.some()).toEqual('value mapped twice');

      done();
    });

    it('Can still flatMap syncronously', () => {
      const maybe = Maybe.Some('value');

      const result = maybe
        .flatMap(val => Maybe.Some(`${val} flatMapped`))
        .flatMap(val => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');
    });
  });

  describe('Async Maybe', () => {
    it('Can map asynchronously', async (done) => {
      const maybe = Maybe.Some('value');

      const result = await maybe
        .awaitMap(val => delay(`${val} mapped`))
        .awaitMap(val => delay(`${val} twice`));

      expect(result.isSome()).toBe(true);
      expect(result.some()).toEqual('value mapped twice');

      done();
    });

    it('Map asynchronously is bypassed on none', async (done) => {
      const maybe = Maybe.None('value');

      const result = await maybe
        .awaitMap(val => delay(`${val} mapped`))
        .awaitMap(val => delay(`${val} twice`));

      expect(result.isNone()).toBe(true);

      done();
    });

    it('Can flatMap asynchronously', async (done) => {
      const maybe = Maybe.Some('value');

      const result = await maybe
        .flatMap(val => delay(Maybe.Some(`${val} flatMapped`)))
        .flatMap(val => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');

      done();
    });

    it('flatMap bypasses none', async (done) => {
      const maybe = Maybe.Some('value');

      const result = await maybe
        .flatMap(val => delay(Maybe.None(`${val} flatMapped once`)))
        .flatMap(val => `${val} not twice`);

      expect(result.isNone()).toBe(true);

      done();
    });
  });
});
