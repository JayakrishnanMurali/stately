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

  const setState: SetState<T> = () => {
    throw new Error("Not Implemented: SetState");
  };

  const destroy = () => {
    throw new Error("Not Implemented: Destroy");
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

const defaultState = {
  hello: "World",
} as const;

const store = create(() => defaultState);

console.log(store.getState(), "hey ---");
