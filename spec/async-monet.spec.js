const {
  monadifyPromises,
  extendMonet,
} = require('../async-monet');
const {
  Either,
  Maybe,
} = require('monet');

extendMonet();

const delay = (val, shouldRes = true) => new Promise((res, rej) =>
  setTimeout(() => shouldRes ? res(val) : rej(val), 500));


describe('Async Monads', () => {
  describe('Standard Either', () => {
    it(
      'Can still map synchronously (as per original monet)',
      () => {
        const either = Either.Right('value');

        const result = either
          .map((val) => `${val} mapped`)
          .map((val) => `${val} twice`);

        expect(result.isRight()).toBe(true);
        expect(result.right()).toEqual('value mapped twice');
      },
    );
  });

  describe('Either left bind', () => {
    it('binds on lefts', () => {
      const either = Either.Left('value');

      const result = either
        .leftBind((val) => Either.Left(`${val} leftBound`))
        .leftFlatMap((val) => `${val} twice`);

      expect(result).toEqual('value leftBound twice');
    });

    it('does not bind on rights', () => {
      const either = Either.Left('value');

      const result = either
        .leftBind((val) => Either.Right(`${val} leftBound once`))
        .leftFlatMap((val) => `${val} not twice`);

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value leftBound once');
    });
  });

  describe('Standard Maybe', () => {
    it(
      'Can still map synchronously (as per original monet)',
      () => {
        const maybe = Maybe.Some('value');

        const result = maybe
          .map((val) => `${val} mapped`)
          .map((val) => `${val} twice`);

        expect(result.isSome()).toBe(true);
        expect(result.some()).toEqual('value mapped twice');
      },
    );

    it('Can still flatMap synchronously', () => {
      const maybe = Maybe.Some('value');

      const result = maybe
        .flatMap((val) => Maybe.Some(`${val} flatMapped`))
        .flatMap((val) => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');
    });
  });

  describe('Tap', () => {
    it('does not affect flow on Eithers', () => {
      const either = Either.Right('value');

      let tappedVal = '';
      const result = either
        .map((val) => `${val} mapped`)
        .tap((val) => {
          tappedVal = val;
          return val;
        })
        .map((val) => `${val} twice`);

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value mapped twice');
      expect(tappedVal).toEqual('value mapped');
    });
  });
});




describe('utils/monads/monadPromises', () => {
  describe('Standard Either', () => {
    it('Can still map synchronously (as per original monet)', () => {
      const either = Either.Right('value');

      const result = either
        .map((val) => `${val} mapped`)
        .map((val) => `${val} twice`);

      expect(result.isRight()).toBe(true);
      expect(result.right()).toEqual('value mapped twice');
    });

    it('Can still flatMap synchronously', () => {
      const either = Either.Right('value');

      const result = either
        .flatMap((val) => Either.Right(`${val} flatMapped`))
        .flatMap((val) => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');
    });
  });

  describe('Async Either usage', () => {
    it('Can flatMap asynchronously', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap((val) => delay(Either.Right(`${val} flatMapped`)))
        .flatMap((val) => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');

      done();
    });

    it('Can finish with asynchronous flatMap', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap((val) => delay(Either.Right(`${val} flatMapped`)))
        .flatMap((val) => delay(`${val} twice`));

      expect(result).toEqual('value flatMapped twice');

      done();
    });

    it('flatMap bypasses left', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap((val) => delay(Either.Left(`${val} flatMapped once`)))
        .flatMap((val) => `${val} not twice`);

      expect(result.isLeft()).toBe(true);
      expect(result.left()).toEqual('value flatMapped once');

      done();
    });
  });

  describe('Standard Maybe', () => {
    it('Can still map synchronously (as per original monet)', () => {
      const maybe = Maybe.Some('value');

      const result = maybe
        .map((val) => `${val} mapped`)
        .map((val) => `${val} twice`);

      expect(result.isSome()).toBe(true);
      expect(result.some()).toEqual('value mapped twice');
    });

    it('Can still flatMap synchronously', () => {
      const maybe = Maybe.Some('value');

      const result = maybe
        .flatMap((val) => Maybe.Some(`${val} flatMapped`))
        .flatMap((val) => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');
    });
  });

  describe('Async Maybe', () => {
    it('Can flatMap asynchronously', async (done) => {
      const maybe = Maybe.Some('value');

      const result = await maybe
        .flatMap((val) => delay(Maybe.Some(`${val} flatMapped`)))
        .flatMap((val) => `${val} twice`);

      expect(result).toEqual('value flatMapped twice');

      done();
    });

    it('flatMap bypasses none', async (done) => {
      const maybe = Maybe.Some('value');

      const result = await maybe
        .flatMap((val) => delay(Maybe.None(`${val} flatMapped once`)))
        .flatMap((val) => `${val} not twice`);

      expect(result.isNone()).toBe(true);

      done();
    });
  });

  describe('Async Cata', () => {
    it('Can cata asynchronously on right', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap((val) => delay(Either.Right(`${val} mapped`)))
        .tap((val) => {
          const val2 = `${val} tapped`;
          return val2;
        })
        .cata(
          (err) => `${err} shouldn't get hit`,
          (val) => delay(Either.Right(`${val} & cata-ed`)),
        )
        .map((val) => `${val} mapped`);

      expect(result.right()).toEqual('value mapped & cata-ed mapped');

      done();
    });

    it('Can cata asynchronously on left', async (done) => {
      const either = Either.Right('value');

      const result = await either
        .flatMap((val) => delay(Either.Left(`${val} mapped`)))
        .cata(
          (errVal) => delay(Either.Left(`${errVal} & cata-ed`)),
          (val) => `${val} shouldn't get hit`,
        )
        .map((val) => `${val} shouldn't get hit`);

      expect(result.left()).toEqual('value mapped & cata-ed');

      done();
    });
  });

  it('Can chain every function', async (done) => {
    const either = Either.Right('value');

    const result = await either
      .map((val) => `${val} mapped`)
      .flatMap((val) => delay(Either.Right(`${val} asyncFlatMapped`)))
      .flatMap((val) => Either.Right(`${val} flatMapped`))
      .map((val) => `${val} mapped`)
      .flatMap((val) => delay(Either.Left(`${val} asyncFlatMappedLeft`)))
      .map(() => 'not called')
      .leftMap((val) => `${val} leftMapped`)
      .leftBind((val) => Either.Left(`${val} leftBound`))
      .leftBind((val) => delay(Either.Right(`${val} leftBound`)))
      .map((val) => `${val} mapped`)
      .cata(
        (val) => `${val} shouldn't get hit`,
        (errVal) => delay(Either.Right(`${errVal} cata-ed`)),
      );

    expect(result.right()).toEqual('value mapped asyncFlatMapped flatMapped mapped asyncFlatMappedLeft leftMapped leftBound leftBound mapped cata-ed');

    done();
  });
});