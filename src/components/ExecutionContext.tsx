import React from "react";
import { StoredDoc } from "../data/database";

export type SearchResult =
  | { type: "node"; name: string; node: StoredDoc<"node"> }
  | { type: "vocabulary"; name: string; symbol: string };

export const ExecutionContext = React.createContext({
  getResult(expression: string) {
    return null;
  },

  getReference(id: string) {
    return null as null | StoredDoc<"node">;
  },

  searchNames(name: string): SearchResult[] {
    return [];
  },
});

export type ExecutionContext = typeof ExecutionContext extends React.Context<
  infer C
>
  ? C
  : never;
