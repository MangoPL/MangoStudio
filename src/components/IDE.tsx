import Fuse from "fuse.js";
import { prop, uniqBy } from "ramda";
import { useMemo } from "react";
import "twin.macro";
import { interpret } from "../compile/jubilee";
import { prelude } from "../compile/symbols";
import { database, doc, ref, upd, useQuery } from "../data/database";
import { ExecutionContext, SearchResult } from "./ExecutionContext";
import ExpressionNode from "./ExpressionNode";

const focusInsert = doc("focus", {
  script: ref(doc("script", { _label: "test" })),
  node: null,
});
const initialDocs = [focusInsert];
const focusId = focusInsert._id!;
database.reset(initialDocs);

export default () => {
  const { script, nodes } = useQuery((db) => {
    const focus = db.doc("focus", focusId)!;

    return {
      script: db.doc("script", focus.script),
      nodes: db.filter("node", (doc) => doc.script === focus.script),
    };
  });

  const service = useMemo(() => {
    const results = interpret(
      Object.fromEntries(
        nodes
          .map((node) => [node._id, node.expression])
          .filter(([, value]) => value != null)
      )
    );

    const fuse = new Fuse<SearchResult>(
      [
        ...nodes
          .filter((value) => value._label)
          .map(
            (value): SearchResult => ({
              type: "node",
              name: value._label,
              node: value,
            })
          ),
        ...uniqBy(
          prop("name"),
          prelude.flatMap((value) =>
            value.alias.map(
              (name): SearchResult => ({
                type: "vocabulary",
                name: name,
                symbol: value.representation,
              })
            )
          )
        ),
      ],
      {
        keys: ["name"],
      }
    );

    return {
      searchNames(string: string) {
        return fuse.search(string).map((value) => value.item);
      },

      getReference(id: string) {
        return nodes.find((node) => node._id === id);
      },

      getResult(docId: string) {
        return results[docId];
      },
    };
  }, [JSON.stringify(nodes.map((node) => [node.expression, node._label]))]);

  return (
    <ExecutionContext.Provider value={service}>
      <div
        onDoubleClick={(e) => {
          database.write(
            upd("focus", focusId, {
              node: ref(
                doc("node", {
                  script: script._id,
                  position: { x: e.clientX, y: e.clientY },
                  expression: null,
                })
              ),
            })
          );
        }}
        tw="w-screen h-screen background-color[#161b22] text-white relative"
      >
        {nodes.map((node) => {
          return <ExpressionNode key={node._id} node={node} />;
        })}
      </div>
    </ExecutionContext.Provider>
  );
};
