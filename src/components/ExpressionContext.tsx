import React from "react";
import { ExecutionContext } from "./ExecutionContext";

export type State = {
  updateType: "internal" | "external";
  mode: EditMode;
  focus: string;
  getService: () => ExecutionContext;
  root: string;
  nodes: Record<string, Expression>;
};

export type UpdateEvent =
  | {
      type: "search";
      value: string;
    }
  | { type: "search.blur" }
  | { type: "search.insert_group" }
  | { type: "search.reference"; reference: string }
  | { type: "search.close_group" }
  | { type: "replace"; ast: Expression };

export type EditMode = "search" | "navigate";

export type Expression<T = { id: string }> =
  | (T & { type: "reference"; reference: string })
  | (T & { type: "group"; children: string[] })
  | (T & { type: "keyword"; keyword: string })
  | (T & { type: "number"; value: number })
  | (T & { type: "search"; value: string; projected?: string });

export const DispatchContext = React.createContext(
  null as React.Dispatch<UpdateEvent>
);

export const StateContext = React.createContext(null as State);

export const DepthContext = React.createContext(0);
