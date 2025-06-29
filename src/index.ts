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
) {}
