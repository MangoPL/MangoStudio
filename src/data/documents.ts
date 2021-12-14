import { DocType, Ref } from "./database";

export type Point = { x: number; y: number };

export type Expression = any;

export type Document =
  | DocType<"script", {}>
  | DocType<
      "node",
      { script: Ref<"script">; position: Point; expression: Expression }
    >
  | DocType<"focus", { script: Ref<"script">; node: Ref<"node"> }>;
