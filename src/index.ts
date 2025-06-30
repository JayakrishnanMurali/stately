export type State = object;

export type GetState<T extends State> = () => T;
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
  subscribe: Subscribe<T>;
  destroy: ReturnVoidFn;
}

export function create<T extends State>(
  initializer: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T
): StoreApi<T> {
  let state: T;
  const listeners = new Set<StateListener<T>>();

  const getState: GetState<T> = () => state;

  const subscribe = (listener: StateListener<T>): ReturnVoidFn => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const setState: SetState<T> = (partial, replace = false) => {
    const patch =
      typeof partial === "function"
        ? (partial as (state: T) => Partial<T>)(state)
        : partial;

    const nextState = replace ? (patch as T) : Object.assign({}, state, patch);

    if (nextState === state) return;

    const previousState = state;
    state = nextState;

    listeners.forEach((listener) => listener(state, previousState));
  };

  const destroy = () => {
    listeners.clear();
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

const counter = create<{
  hello: number;
}>((set) => ({
  hello: 1,
}));

const unsubscribe = counter.subscribe((newVal, oldVal) => {
  console.log("changed from", oldVal, "to", newVal);
});

console.log(counter.getState()); // 0
counter.setState((n) => ({
  hello: n.hello + 1,
}));
// should log: “changed from 0 to 1”
console.log(counter.getState()); // 1

unsubscribe();
counter.setState((n) => ({
  hello: n.hello + 2,
}));
