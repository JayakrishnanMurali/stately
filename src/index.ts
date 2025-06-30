export type State = object;

export interface GetState<T extends State> {
  (): T;
  <U>(select: StateSelector<T, U>): U;
}
export type SetState<T extends State> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean
) => void;

type ReturnVoidFn = () => void;

export type StateListener<T extends State> = (state: T, prevState: T) => void;
export type Subscribe<T extends State> = (
  listener: StateListener<T>
) => ReturnVoidFn;

export interface StoreApi<T extends State> {
  getState: GetState<T>;
  setState: SetState<T>;
  destroy: ReturnVoidFn;
  subscribe(listener: StateListener<T>): ReturnVoidFn;
  subscribe<U>(
    listener: (slice: U, prevSlice: U) => void,
    selector: StateSelector<T, U>,
    equalityFn?: EqualityChecker<U>
  ): ReturnVoidFn;
}

export type StateSelector<T, U> = (state: T) => U;

export type EqualityChecker<U> = (a: U, b: U) => boolean;

type SubscriberEntry<T, U = T> = {
  listener: (next: U, prev: U) => void;
  selector: StateSelector<T, U>;
  equalityFn: EqualityChecker<U>;
  prevSlice: U;
};

export function create<T extends State>(
  initializer: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T
): StoreApi<T> {
  let state: T;
  const subscribers = new Set<SubscriberEntry<T, any>>();

  const getState: GetState<T> = ((selector?: (state: T) => T) => {
    if (!selector) return state;

    return selector(state);
  }) as GetState<T>;

  function subscribe<U>(
    listener: (slice: U, prevSlice: U) => void,
    selector: StateSelector<T, U> = (s) => s as unknown as U,
    equalityFn: EqualityChecker<U> = Object.is
  ): ReturnVoidFn {
    const entry: SubscriberEntry<T, U> = {
      listener,
      selector,
      equalityFn,
      prevSlice: selector(state),
    };

    subscribers.add(entry);

    return () => {
      subscribers.delete(entry);
    };
  }

  const setState: SetState<T> = (partial, replace = false) => {
    const patch =
      typeof partial === "function"
        ? (partial as (state: T) => Partial<T>)(state)
        : partial;

    const nextState = replace ? (patch as T) : Object.assign({}, state, patch);

    if (nextState === state) return;

    const previousState = state;
    state = nextState;

    for (const entry of subscribers) {
      const nextSlice = entry.selector(state);
      if (!entry.equalityFn(entry.prevSlice, nextSlice)) {
        entry.listener(nextSlice, entry.prevSlice);
        entry.prevSlice = nextSlice;
      }
    }
  };

  const destroy = () => {
    subscribers.clear();
  };

  const api: StoreApi<T> = {
    getState,
    setState,
    subscribe,
    destroy,
  };

  state = initializer(setState, getState, api);

  return api;
}

// Testing remove later:

type ObjectState = { count: number; text: string };

const store = create<ObjectState>(() => ({ count: 0, text: "hi" }));

// 1) Full-state subscription
store.subscribe((s) => console.log("full:", s));

// 2) Slice subscription
store.subscribe(
  (count, prev) => console.log("count changed:", prev, "→", count),
  (s) => s.count
);

// 3) Custom equality (e.g., watch length of text)
store.subscribe(
  (len, prevLen) => console.log("text length:", prevLen, "→", len),
  (s) => s.text.length,
  (a, b) => a === b
);

store.setState((s) => ({ count: s.count + 1 }));
store.setState({ text: "hello" });
