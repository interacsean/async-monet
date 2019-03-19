/* The (covariant) functor typeclass */
interface Functor<T> {
  map<V>(fn: (val: T) => V): Functor<V>;
}

/* Typeclass for binding, the core monadic transformation */
interface Bind<T> {
  bind<V>(fn: (val: T) => Bind<V>): Bind<V>;
  chain<V>(fn: (val: T) => Bind<V>): Bind<V> | Promise<Bind<V>>;    // alias of bind
  flatMap<V>(fn: (val: T) => Bind<V>): Bind<V> | Promise<Bind<V>>;  // alias of bind
  join<V>(): Bind<V>;  // works only if T = Bind<V>
}

/* Applicative allows applying wrapped functions to wrapped elements */
interface Applicative<T> {
  ap<V>(afn: Applicative<(val: T) => V>): Applicative<T>;
}

interface IMonadicPromise<T> {
  then<A, B>(v: A): B;
  catch<E, F>(e: E): F;
  promise(): Promise<T>;
}

/****************************************************************
* Basic Monad Interface
*/

interface IMonad<T> extends Functor<T>, Bind<T>, Applicative<T> {
  /* These all are defined in Functor, Bind and Applicative: */
  bind<V>(fn: (val: T) => IMonad<V>): IMonad<V>;
  flatMap<V>(fn: (val: T) => IMonad<V>): IMonad<V>;
  map<V>(fn: (val: T) => V): IMonad<V>;
  join<V>(): IMonad<V>; // only if T = IMonad<V>

  /* These are monet-Monad-specific: */
  takeLeft(m: IMonad<T>): IMonad<T>;
  takeRight(m: IMonad<T>): IMonad<T>;
  tap(fn: (val: T) => void): IMonad<T>;
}

interface IMonadFactory extends Function {
  <T>(val: T): IMonad<T>;
}

interface IMonadStatic {
  unit: IMonadFactory;
  of: IMonadFactory;    // alias for unit
  pure: IMonadFactory;  // alias for unit
}

/****************************************************************
* Identity
*/

export interface Identity<T> extends IMonad<T> {
  /* Inherited from Monad: */
  bind<V>(fn: (val: T) => Identity<V>): Identity<V>;
  flatMap<V>(fn: (val: T) => Identity<V>): Identity<V>;
  chain<V>(fn: (val: T) => Identity<V>): Identity<V>;
  map<V>(fn: (val: T) => V): Identity<V>;
  join<V>(): Identity<V>; // if T is Identity<V>
  takeLeft(m: Identity<T>): Identity<T>;
  takeRight(m: Identity<T>): Identity<T>;

  /* Identity specific */
  get(): T;
}

interface IIdentityFactory extends IMonadFactory {
  <V>(value: V): Identity<V>;
}

interface IIdentityStatic extends IIdentityFactory, IMonadStatic {
  unit: IIdentityFactory;
  of: IIdentityFactory;    // alias for unit
  pure: IIdentityFactory;  // alias for unit
}

export const Identity: IIdentityStatic;

/****************************************************************
* Maybe
*/

export interface Maybe<T> {
  bind<V>(fn: (val: T) => Maybe<V>): Maybe<V>;
  /* Inherited from Monad: */
  flatMap<V>(fn: (val: T) => Maybe<V>): Maybe<V>;
  join<V>(): Maybe<V> | Promise<Maybe<V>>; // if T is Identity<V>
  takeLeft(m: Maybe<T>): Maybe<T> | Promise<Maybe<T>>;
  takeRight(m: Maybe<T>): Maybe<T> | Promise<Maybe<T>>;
  // chain<V>(fn: (val: T) => Maybe<V> | Promise<Maybe<V>>): Maybe<V> | Promise<Maybe<V>>;

  // $#:
  asyncFlatMap<V>(fn: (val: T) => Promise<Maybe<V>>): Promise<Maybe<V>>;
  flip<V>(m: T): Maybe<V>;
  tap<T>(fn: (val: T) => void): Maybe<T>;
  awaitMap<V>(fn: (val: T) => Promise<V>): Promise<Maybe<V>>;
  leftBind<V>(fn: () => Maybe<V>): Maybe<V>;
  asyncLeftBind<T>(fn: () => Promise<Maybe<T>>): Promise<Maybe<T>>;
  
  
  /* Inherited from Applicative */
  ap<V>(maybeFn: Maybe<(val: T) => V>): Maybe<V> | Promise<Maybe<V>>;
  
  /* Maybe specific */
  cata<Z>(none: () => Z, some: (val: T) => Z): Z;
  fold<V>(val: V): (fn: (val: T) => V) => V;
  
  filter(fn: (val: T) => boolean): Maybe<T> | Promise<Maybe<T>>;
  map<V>(fn: (val: T) => V): Maybe<V>;
  
  isSome(): boolean;
  isJust(): boolean;
  isNone(): boolean;
  isNothing(): boolean;
  some(): T;
  just(): T;
  orSome(val: T): T;
  orJust(val: T): T;
  orElse(maybe: Maybe<T>): Maybe<T>;

  toList(): List<T>;
  toEither<E>(left?: E): Either<E, T>;
  toValidation<E>(fail?: E): Validation<E, T>;
}

interface ISomeStatic extends IMonadFactory {
  <V>(value: V): Maybe<V>;
}

interface INoneStatic extends IMonadFactory {
  <V>(): Maybe<V>;
}

interface IMaybeStatic extends IMonadStatic {
  Some: ISomeStatic;
  Just: ISomeStatic;
  None: INoneStatic;
  Nothing: INoneStatic;
  fromNull<V>(val: V): Maybe<V>;
  unit: ISomeStatic;
  of: ISomeStatic;    // alias for unit
  pure: ISomeStatic;  // alias for unit

  // $#:
  fromPromise<T>(p: Promise<T>): Promise<Maybe<T>>;
  init<T>(isVal: boolean, val?: T): Maybe<T>;
}

export const Some: ISomeStatic;
export const Just: ISomeStatic;
export const None: INoneStatic;
export const Nothing: INoneStatic;
export const Maybe: IMaybeStatic;

/****************************************************************
* Either
*/

export interface Either<E, T> {
  bind<V>(fn: (val: T) => Either<E, V>): Either<E, V>;
  /* Inherited from Monad: */
  flatMap<V>(fn: (val: T) => Either<E, V>): Either<E, V>;
  chain<V>(fn: (val: T) => Either<E, V>): Either<E, V>;
  map<V>(fn: (val: T) => V): Either<E, V>;
  join<V>(): Either<E, V>; // if T is Either<V>
  takeLeft(m: Either<E, T>): Either<E, T>;
  takeRight(m: Either<E, T>): Either<E, T>;
  
  // $#:
  asyncFlatMap<V>(fn: (val: T) => Promise<Either<E, V>>): Promise<Either<E, V>>;
  flip<E, T>(): Either<T, E>;
  tap<A>(fn: (val: A) => void): Either<E, T>;
  asyncLeftBind<F>(fn: (leftVal: E) => Promise<Either<F, T>>): Promise<Either<F, T>>;
  awaitMap<V>(fn: (val: T) => Promise<V>): Promise<Either<E, V>>;

  /* Inherited from Applicative */
  ap<V>(eitherFn: Either<E, (val: T) => V>): Either<E, V>;

  /* Either specific */
  cata<Z>(leftFn: (err: E) => Z, rightFn: (val: T) => Z): Z;

  bimap<Z, V>(leftFn: (err: E) => Z, rightFn: (val: T) => V): Either<Z, V>;
  leftMap<F>(fn: (leftVal: E) => F): Either<F, T>;
  leftBind<F>(fn: (leftVal: E) => Either<F, T>): Either<F, T>;

  isRight(): boolean;
  isLeft(): boolean;
  right(): T;
  left(): E;

  toValidation(): Validation<E, T>;
  toMaybe(): Maybe<T>;
}

interface IEitherStatic extends IMonadStatic {
  Right: IRightStatic;
  Left: ILeftStatic;
  unit: IRightStatic;
  of: IRightStatic;    // alias for unit
  pure: IRightStatic;  // alias for unit
  fromPromise<E, T>(p: Promise<T>): Promise<Either<E, T>>;
  init<L, R>(isRight: boolean, val: L | R, rightVal?: R): Either<L, R>;
}

interface IRightStatic extends IMonadFactory {
  <F, V>(val: V): Either<F, V>;
}

interface ILeftStatic extends IMonadFactory {
  <F, V>(val: F): Either<F, V>;
}

export const Either: IEitherStatic;
export const Right: IRightStatic;
export const Left: ILeftStatic;

/****************************************************************
* Validation
*/

interface IValidationAcc extends Function {
  (): IValidationAcc;
}

export interface Validation<E, T> extends IMonad<T> {
  /* Inherited from Monad: */
  bind<V>(fn: (val: T) => Validation<E, V>): Validation<E, V>;
  flatMap<V>(fn: (val: T) => Validation<E, V>): Validation<E, V>;
  chain<V>(fn: (val: T) => Validation<E, V>): Validation<E, V>;
  map<V>(fn: (val: T) => V): Validation<E, V>;
  join<V>(): Validation<E, V>; // if T is Validation<E, V>
  takeLeft(m: Validation<E, T>): Validation<E, T>;
  takeRight(m: Validation<E, T>): Validation<E, T>;

  /* Inherited from Applicative */
  ap<V>(eitherFn: Validation<E, (val: T) => V>): Validation<E, V>;

  /* Validation specific */
  cata<Z>(failFn: (fail: E) => Z, successFn: (val: T) => Z): Z;

  bimap<F, V>(fnF: (fail: E) => F, fnS: (val: T) => V): Validation<F, V>;
  failMap<F>(fn: (fail: E) => F): Validation<F, T>;

  isSuccess(): boolean;
  isFail(): boolean;
  success(): T;
  fail(): E;

  acc(): Validation<E, IValidationAcc>;

  toEither(): Either<E, T>;
  toMaybe(): Maybe<T>;
}

interface IValidationStatic extends IMonadStatic {
  Success: ISuccessStatic;
  Fail: IFailStatic;
  success: ISuccessStatic;
  fail: IFailStatic;
  unit: ISuccessStatic;
  of: ISuccessStatic;     // alias for unit
  pure: ISuccessStatic;   // alias for unit
  point: ISuccessStatic;  // alias for unit
}

interface ISuccessStatic extends IMonadFactory {
  <E, T>(val: T): Validation<E, T>;
}

interface IFailStatic extends IMonadFactory {
  <E, T>(err: E): Validation<E, T>;
}

export const Validation: IValidationStatic;
export const Success: ISuccessStatic;
export const Fail: IFailStatic;

/****************************************************************
* List
*/

export interface List<T> extends IMonad<T> {
  /* Inherited from Monad: */
  bind<V>(fn: (val: T) => List<V>): List<V>;
  flatMap<V>(fn: (val: T) => List<V>): List<V>;
  chain<V>(fn: (val: T) => List<V>): List<V>;
  map<V>(fn: (val: T) => V): List<V>;
  join<V>(): List<V>; // if T is List<V>
  takeLeft<V>(m: List<V>): List<T>;
  takeRight<V>(m: List<V>): List<V>;

  /* Inherited from Applicative */
  ap<V>(listFn: List<(val: T) => V>): List<V>;

  /* Validation specific */
  foldLeft<V>(initial: V): (fn: (acc: V, element: T) => V) => V;
  foldRight<V>(initial: V): (fn: (element: T, acc: V) => V) => V;

  filter(fn: (val: T) => boolean): List<T>;
  cons(a: T): List<T>;
  snoc(a: T): List<T>;
  isNEL(): boolean;
  size(): number;
  head(): T;
  headMaybe(): Maybe<T>;
  append(list: List<T>): List<T>;
  concat(list: List<T>): List<T>;
  reverse(): List<T>;
  tail(): List<T>;
  tails(): List<List<T>>;
  flatten<V>(): List<V>;   // === join
  flattenMaybe<V>(): List<V>; // if T is Maybe<V>

  sequence<V>(m: IMaybeStatic): Maybe<List<V>>;
  sequence<E, V>(m: IEitherStatic): Either<E, List<V>>;
  sequence<E, V>(m: IValidationStatic): Validation<List<E>, List<V>>;
  sequence<V>(m: IIOStatic): IO<List<V>>;
  sequence<E, A>(m: IReaderStatic): Reader<E, List<A>>;
  sequenceMaybe<V>(): Maybe<List<V>>;
  sequenceEither<E, V>(): Either<E, List<V>>;
  sequenceValidation<E, V>(): Validation<List<E>, List<V>>;
  sequenceIO<V>(): IO<List<V>>;
  sequenceReader<E, A>(): Reader<E, List<A>>;

  toArray(): T[];
}

export interface Nil extends List<void> {
  cons<T>(a: T): List<T>;
  append<T>(list: List<T>): List<T>;
  concat<T>(list: List<T>): List<T>;
}

interface IListFactory extends IMonadFactory {
  <T>(val?: T, tail?: List<T>): List<T>;
}

interface IListStatic extends IListFactory, IMonadStatic {
  fromArray<T>(arr: T[]): List<T>;
  unit: IListFactory;
  of: IListFactory;    // alias for unit
  pure: IListFactory;  // alias for unit
}

export const List: IListStatic;
export const Nil: Nil;

/****************************************************************
* NEL
*/

export interface NEL<T> extends IMonad<T> {
  /* Inherited from Monad: */
  bind<V>(fn: (val: T) => NEL<V>): NEL<V>;
  flatMap<V>(fn: (val: T) => NEL<V>): NEL<V>;
  chain<V>(fn: (val: T) => NEL<V>): NEL<V>;
  map<V>(fn: (val: T) => V): NEL<V>;
  // FIXME: `.join()` is broken due to lack of `.cons()`
  // join<V>(): NEL<V>; // if T is NEL<V>
  takeLeft<V>(m: NEL<V>): NEL<T>;
  takeRight<V>(m: NEL<V>): NEL<V>;

  /* from CoMonad: */
  mapTails<V>(fn: (val: NEL<T>) => V): NEL<V>;
  cobind<V>(fn: (val: NEL<T>) => V): NEL<V>;
  coflatMap<V>(fn: (val: NEL<T>) => V): NEL<V>;
  cojoin(): NEL<NEL<T>>;      // === tails
  extract(): T;               // === head

  /* Inherited from Applicative */
  ap<V>(listFn: NEL<(val: T) => V>): NEL<V>;

  /* Validation specific */
  foldLeft<V>(initial: V): (fn: (acc: V, element: T) => V) => V;
  foldRight<V>(initial: V): (fn: (element: T, acc: V) => V) => V;
  reduceLeft(fn: (acc: T, element: T) => T): T;

  filter(fn: (val: T) => boolean): List<T>;
  // cons(a: T): NEL<T>;
  // snoc(a: T): NEL<T>;
  isNEL(): boolean;
  size(): number;
  head(): T;
  append(list: NEL<T>): NEL<T>;
  concat(list: NEL<T>): NEL<T>;
  reverse(): NEL<T>;
  tail(): List<T>;
  tails(): NEL<NEL<T>>;
  // flatten<V>(): NEL<V>;
  // flattenMaybe<V>(): NEL<V>;

  toArray(): T[];
  toList(): List<T>;
}

export type NonEmptyList<T> = NEL<T>;

interface INELFactory extends IMonadFactory {
  <T>(val: T, tail?: List<T>): NEL<T>;
}

interface INELStatic extends INELFactory, IMonadStatic {
  fromList<T>(arr: List<T>): Maybe<NEL<T>>;
  unit: INELFactory;
  of: INELFactory;    // alias for unit
  pure: INELFactory;  // alias for unit
}

export const NonEmptyList: INELStatic;
export const NEL: INELStatic;

/****************************************************************
* IO
*/

export interface IO<T> extends IMonad<T> {
  /* Inherited from Monad: */
  bind<V>(fn: (val: T) => IO<V>): IO<V>;
  flatMap<V>(fn: (val: T) => IO<V>): IO<V>;
  chain<V>(fn: (val: T) => IO<V>): IO<V>;
  map<V>(fn: (v: T) => V): IO<V>;
  join<V>(): IO<V>; // if T is IO<V>
  takeLeft<X>(m: IO<X>): IO<T>;
  takeRight<V>(m: IO<V>): IO<V>;

  /* Inherited from Applicative: */
  ap<V>(ioFn: IO<(v: T) => V>): IO<V>;

  /* IO specific: */
  run(): T;
  perform(): T;         // Alias for run()
  performUnsafeIO(): T; // Alias for run()
}

interface IIOFactory extends IMonadFactory {
  <T>(fn: () => T): IO<T>;
}

interface IIOStatic extends IIOFactory, IMonadStatic {
  unit: IIOFactory;
  of: IIOFactory;    // alias for unit
  pure: IIOFactory;  // alias for unit
  io: IIOFactory;    // alias for unit
}

export const IO: IIOStatic;

/****************************************************************
* Reader
*/

export interface Reader<E, A> extends IMonad<A> {
  /* Inherited from Monad: */
  bind<B>(fn: (val: A) => Reader<E, B>): Reader<E, B>;
  flatMap<B>(fn: (val: A) => Reader<E, B>): Reader<E, B>;
  chain<B>(fn: (val: A) => Reader<E, B>): Reader<E, B>;
  map<B>(fn: (val: A) => B): Reader<E, B>;
  join<B>(): Reader<E, B>; // if A is Reader<E, B>
  takeLeft<X>(m: Reader<E, X>): Reader<E, A>;
  takeRight<B>(m: Reader<E, B>): Reader<E, B>;
  ap<B>(rfn: Reader<E, (val: A) => B>): Reader<E, B>;

  /* Reader-specific: */
  run(config: E): A;
  local<X>(fn: (val: X) => E): Reader<X, A>;
}

interface IReaderFactory extends IMonadFactory {
  <E, A>(fn: (env: E) => A): Reader<E, A>;
}

interface IReaderStatic extends IReaderFactory, IMonadStatic {
  unit: IReaderFactory;
  of: IReaderFactory;    // alias for unit
  pure: IReaderFactory;  // alias for unit
  point: IReaderFactory; // alias for unit
  ask<E>(): Reader<E, E>;
}

export const Reader: IReaderStatic;

/****************************************************************
* Free
*/
export interface Free<A> extends IMonad<A> {
  /* A free monad over functor F.
   * It holds values of type F<A> for some functor F.
   *
   *
   * Typing caveats:
   * TypeScript does not support higher-kinded types, meaning you can't
   * just specify the type of the functor. This leads to the following issues:
   *
   * 1. Some methods operating on type T require FT or FFT as type parameters.
   *    FT = F<T> and FFT = F<Free<T>>, but we can't simply infer that.
   * 2. The Free<A> interface does not include the information on what kind
   *    of functor is used. So it is possible to `bind` two free monads
   *    over different functors. This will most likely crash, and we can't
   *    statically prohibit it. As a general rule, free monads over different
   *    functors are totally incompatible.
   */
  bind<V>(fn: (val: A) => Free<V>): Free<V>;
  flatMap<V>(fn: (val: A) => Free<V>): Free<V>;
  chain<V>(fn: (val: A) => Free<V>): Free<V>;
  join<V>(): Free<V>; // only if A = Free<V> on the same functor
  map<V>(fn: (val: A) => V): Free<V>;
  takeLeft<X>(other: Free<X>): Free<A>;
  takeRight<B>(other: Free<B>): Free<B>;

  /* Free-specific: */
  // evaluates a single layer
  resume<FFA>(): Either<FFA, A>;
  // runs to completion using given extraction function:
  go<FFA>(extract: (sus: FFA) => Free<A>): A;
}

interface IFreeStatic extends IMonadStatic {
  Return: IReturnStatic;
  Suspend: ISuspendStatic;
  unit: IReturnStatic;
  of: IReturnStatic;    // alias for unit
  pure: IReturnStatic;  // alias for unit
  liftF<A, FA>(fa: FA): Free<A>; // FA = F<A>
}

interface IReturnStatic extends IMonadFactory {
  <A>(a: A): Free<A>;
}

interface ISuspendStatic extends IMonadFactory {
  <A, FFA>(ffa: FFA): Free<A>;
}

declare global {

  interface Promise<T> extends IMonad<T> {

    /* Inherited from Monad: */
    // bind<V>(fn: (val: T) => IMonad<V>): Promise<IMonad<V>>;
    asyncLeftBind<E, F>(fn: (val: E) => Promise<IMonad<F>> | IMonad<F>): Promise<any>;
    asyncFlatMap<B, V>(fn: (val: B) => Promise<IMonad<V>> | IMonad<V>): Promise<any>;
    // chain<V>(fn: (val: T) => IMonad<V>): Promise<any>;
    // map<B, V>(fn: (val: B) => V): Promise<any>;
    asyncMap<B, V>(fn: (val: B) => V): Promise<any>;
    asyncAwaitMap<B, V>(fn: (val: B) => Promise<V>): Promise<any>;
    // leftMap<E, V, F>(fn: (val: E) => F): Promise<any>;
    asyncLeftMap<E, V, F>(fn: (val: E) => F | Promise<F>): Promise<any>;
    // join<V>(): Promise<any>; // if T is Identity<V>
    // takeLeft(m: IMonad<T>): Promise<IMonad<T>>;
    // takeRight(m: IMonad<T>): Promise<IMonad<T>>;
    asyncTap<V>(fn: (val: V) => void): Promise<T>;

    /* Inherited from Applicative */
    // ap<V>(maybeFn: IMonad<(val: T) => V>): Promise<IMonad<V>>;

    /* Maybe specific */
    asyncCata<Z>(noneOrLeft: (val?: any) => Z, someOrRight: (val: any) => Z): Promise<Z>;
    // fold<V>(val: V): (fn: (val: T) => V) => V;

    // filter(fn: (val: T) => boolean): Promise<IMonad<T>>;
    awaitMap(fn: (val: any) => Promise<any>): Promise<any>;
  }
}
export const Free: IFreeStatic;
export const Return: IReturnStatic;
export const Suspend: ISuspendStatic;
export const extendMonet: Function;
