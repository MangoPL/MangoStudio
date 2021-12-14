import { css } from "@emotion/react";
import { useContext, useEffect, useReducer, useState } from "react";
import AutosizeInput from "react-input-autosize";
import { fromEvent, merge, Observable, tap } from "rxjs";
import "twin.macro";
import { add, subtract } from "../vectors";
import { database, StoredDoc, upd } from "../data/database";
import { Point } from "../data/documents";
import { ExecutionContext } from "./ExecutionContext";
import Expression from "./Expression";

type ExpressionNodeProps = {
  node: StoredDoc<"node">;
};

type DragEvent =
  | {
      type: "move";
      point: Point;
    }
  | {
      type: "up";
      point: Point;
    }
  | {
      type: "down";
      point: Point;
    };

type DragState = null | { start: Point; current: Point };

function dragReducer(state: DragState, event: DragEvent): DragState {
  if (event.type === "down") {
    return {
      start: event.point,
      current: event.point,
    };
  }

  if (state) {
    if (event.type === "move") {
      return { ...state, current: event.point };
    }

    if (event.type === "up") {
      return null;
    }
  }

  return state;
}

export default ({ node }: ExpressionNodeProps) => {
  const [dragState, dispatch] = useReducer(dragReducer, null);
  const executionContext = useContext(ExecutionContext);

  useEffect(() => {
    if (dragState != null) {
      const move = fromEvent(document, "mousemove") as Observable<MouseEvent>;
      const up = fromEvent(document, "mouseup") as Observable<MouseEvent>;
      const sub = merge(
        move.pipe(
          tap((e) => {
            dispatch({ type: "move", point: { x: e.clientX, y: e.clientY } });
          })
        ),
        up.pipe(
          tap((e) => {
            const point = { x: e.clientX, y: e.clientY };
            dispatch({ type: "up", point: point });
            database.write(
              upd("node", node._id, {
                position: add(node.position, subtract(point, dragState.start)),
              })
            );
          })
        )
      ).subscribe();

      return () => {
        sub.unsubscribe();
      };
    }
  }, [dragState == null]);

  const dragDelta = dragState
    ? subtract(dragState.current, dragState.start)
    : null;

  const result = executionContext.getResult(node._id);
  const [name, setName] = useState(null as string | null);

  return (
    <div
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        dispatch({ type: "down", point: { x: e.clientX, y: e.clientY } });
      }}
      style={{
        position: "absolute",
        top: node.position.y,
        left: node.position.x,
        transform: dragDelta
          ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
          : null,
      }}
    >
      <div
        tw="relative"
        css={[
          node._label == null &&
            css`
              &:not(:hover) {
                opacity: 0;
              }

              &:focus-within {
                opacity: 1;
              }
            `,

          css`
            input {
              background-color: transparent;
              border: none;
              color: white;
            }
          `,
        ]}
      >
        <AutosizeInput
          placeholder={"name"}
          value={name ?? node._label ?? ""}
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={(e) => {
            setName(null);
            database.write(
              upd("node", node._id, {
                _label: e.currentTarget.value,
              })
            );
          }}
          tw="text-xs color[rgba(255,255,255,0.5)] absolute transform[translateY(-100%)]"
        />
      </div>

      <div>
        <Expression
          tw="border border-white border-width[0.5px]"
          onChange={(expression) => {
            database.write(
              upd("node", node._id, {
                expression,
              })
            );
          }}
        />
      </div>
      {result && <pre>{JSON.stringify(result)}</pre>}
    </div>
  );
};
