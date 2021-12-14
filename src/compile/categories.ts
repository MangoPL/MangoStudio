export type EConstructor<ID = string, P = string[]> = { id: ID; parameters: P };

export type EInstance<P = EConstructor> = {
  constructor: P;
  arguments: EInstance[];
};

export const data = <ID extends string, P extends string[]>(
  id: ID,
  ...parameters: P
): EConstructor<ID, P> => {
  return {
    id,
    parameters,
  };
};

export const instance = <C extends EConstructor>(
  constructor: C,
  ...args: EInstance[]
): EInstance<C> => {
  return {
    constructor,
    arguments: args,
  };
};

export const Monad = data("mango.Monad", "y");
export const Dyad = data("mango.Dyad", "x", "y");
export const Number = data("mango.Number");
export const Vector = data("mango.Vector", "item");
