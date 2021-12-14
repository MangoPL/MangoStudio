import { css } from "@emotion/react";
import immer from "immer";
import { hsl, parseToHsl } from "polished";
import React, {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import AutosizeInput from "react-input-autosize";
import "twin.macro";
import * as uuid from "uuid";
import {
  getTypes,
  group,
  GroupableToken,
  printTokens,
  tokenize,
} from "../compile/jubilee";
import { ExecutionContext } from "./ExecutionContext";
import {
  DepthContext,
  DispatchContext,
  Expression,
  State,
  StateContext,
  UpdateEvent,
} from "./ExpressionContext";

type Expr<t> = Extract<Expression, { type: t }>;

const makeNode = (
  nodes: Record<string, Expression>,
  node: Expression<{ id?: string }>,
  map?: (expression: Expression) => Expression
): Expression => {
  const makeChildren = (node: Expression<{ id?: string }>) => {
    if (node.type === "group") {
      return {
        types: undefined,
        children: node.children.map((value) => {
          if (typeof value === "string") {
            return value;
          }

          const newNode = makeNode(nodes, value as any, map);

          return newNode.id;
        }),
      };
    }

    return {};
  };

  let withId: Expression = {
    id: uuid.v4(),
    ...node,
    ...makeChildren(node),
  };

  if (map) {
    withId = map(withId);
    withId = {
      id: uuid.v4(),
      ...withId,
      ...makeChildren(withId),
    };
  }

  nodes[withId.id] = withId;

  return withId;
};

const getParents = (nodes: Record<string, Expression>) => {
  const parents = new Map();

  for (const node of Object.values(nodes)) {
    if (node.type === "group") {
      node.children.map((child) => {
        parents.set(child, node.id);
      });
    }
  }

  return parents;
};

const getAST = (nodes: Record<string, Expression>, id: string): any => {
  const node = nodes[id];

  if (node.type === "group") {
    return {
      ...node,
      children: node.children.map((value) => getAST(nodes, value)),
    };
  }

  return node;
};

const groupTokens = (
  state: State,
  parents: Map<string, string>,
  search?: string | GroupableToken[]
) => {
  const ctx = state.getService();
  const tokens = typeof search === "string" ? tokenize(search) : search;
  const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;
  const groupTokens = parent.children.flatMap(
    (value, index): GroupableToken[] => {
      const ast = getAST(state.nodes, value);

      if (ast.type !== "search") {
        return [{ type: "stub", index, types: getTypes(ctx, ast) }];
      }

      return tokens ?? ast;
    }
  );
  console.log(JSON.stringify(groupTokens));
  return group(ctx, groupTokens);
};

const updaters: {
  [key in UpdateEvent["type"]]: (
    state: State,
    event: Extract<UpdateEvent, { type: key }>
  ) => State | void;
} = {
  "search.reference": (state, event) => {
    const focusNode = state.nodes[state.focus];
    const parents = getParents(state.nodes);

    if (focusNode.type === "search") {
      const grouped = groupTokens(state, parents, [
        { type: "reference", reference: event.reference },
      ]);
      const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;
      const newSearch = { id: uuid.v4(), type: "search", value: "" };

      makeNode(
        state.nodes,
        {
          id: parent.id,
          type: "group",
          children: [...grouped, newSearch] as any,
        },
        (token: any) => {
          if (token.type === "stub") {
            return {
              ...state.nodes[parent.children[token.index]],
              id: uuid.v4(),
            };
          }

          return token;
        }
      );

      state.focus = newSearch.id;
    }
  },

  "search.blur": (state, event) => {
    const focusNode = state.nodes[state.focus];
    const parents = getParents(state.nodes);

    if (focusNode.type === "search") {
      try {
        const grouped = groupTokens(state, parents, focusNode.value);
        const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;

        if (grouped.length === 1) {
          const newParent = makeNode(
            state.nodes,
            { ...grouped[0], id: parents.get(state.focus) } as any,
            (token: any) => {
              if (token.type === "stub") {
                return {
                  ...state.nodes[parent.children[token.index]],
                  id: token.id ?? uuid.v4(),
                };
              }

              return token;
            }
          );
          state.focus = newParent.id;
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  "search.close_group": (state, event) => {
    const focusNode = state.nodes[state.focus];
    const parents = getParents(state.nodes);

    if (focusNode.type === "search") {
      try {
        const grouped = groupTokens(state, parents, focusNode.value);
        const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;
        const newSearch: Expr<"search"> = {
          id: uuid.v4(),
          type: "search",
          value: "",
        };

        if (grouped.length === 1) {
          makeNode(
            state.nodes,
            { id: parents.get(state.focus), ...grouped[0] } as any,
            (token: any) => {
              if (token.type === "stub") {
                return {
                  ...state.nodes[parent.children[token.index]],
                  id: uuid.v4(),
                };
              }

              if (token._search) {
                delete token._search;
              }

              return token;
            }
          );

          let grandparent = state.nodes[
            parents.get(parent.id)
          ] as Expr<"group">;

          if (grandparent) {
            grandparent.children.push(makeNode(state.nodes, newSearch).id);
          }
        }

        state.focus = newSearch.id;
      } catch (e) {
        console.error(e);
      }
    }
  },

  "search.insert_group": (state, event) => {
    const focusNode = state.nodes[state.focus];
    const parents = getParents(state.nodes);

    if (focusNode.type === "search") {
      try {
        const grouped = groupTokens(state, parents, focusNode.value);
        const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;
        const newSearch = { id: uuid.v4(), type: "search", value: "" };

        makeNode(
          state.nodes,
          {
            id: parents.get(state.focus),
            type: "group",
            children: [...grouped, { type: "group", children: [newSearch] }],
          } as any,
          (token: any) => {
            if (token.type === "stub") {
              return {
                ...state.nodes[parent.children[token.index]],
                id: uuid.v4(),
              };
            }

            return token;
          }
        );

        state.focus = newSearch.id;
      } catch (e) {
        console.error(e);
      }
    }
  },

  search: (state, event) => {
    const focusNode = state.nodes[state.focus];
    const parents = getParents(state.nodes);

    if (focusNode.type === "search") {
      try {
        focusNode.value = event.value;

        const grouped = groupTokens(state, parents);
        const parent = state.nodes[parents.get(state.focus)] as Expr<"group">;
        console.log(JSON.stringify(grouped));

        const newFocus = uuid.v4();

        makeNode(
          state.nodes,
          {
            ...(grouped.length === 1
              ? (grouped[0] as any)
              : { type: "group", children: grouped as any }),
            id: parent.id,
          },
          (token: any) => {
            if (token.type === "stub") {
              return {
                ...state.nodes[parent.children[token.index]],
                id: uuid.v4(),
              };
            }

            if (token._search) {
              return {
                id: token.id,
                type: "group",
                children: [
                  {
                    id: newFocus,
                    type: "search",
                    value: printTokens([token]),
                  },
                ],
              };
            }

            return token;
          }
        );

        state.focus = newFocus;
      } catch (e) {
        console.error(e);
      }
    }
  },

  replace: (state) => {
    state.updateType = "external";
  },
};

const reducer = (state: State, event: UpdateEvent) => {
  return immer(state, (state) => {
    state.updateType = "internal";
    return updaters[event.type](state, event as any);
  });
};

const initialState = ({ serviceRef }: any): State => {
  const searchNode = { id: uuid.v4(), type: "search", value: "" };

  const baseNode: Expression = {
    id: uuid.v4(),
    type: "group",
    children: [searchNode] as any,
  };

  const state: State = {
    getService() {
      return serviceRef.current;
    },
    updateType: "external",
    mode: "search",
    focus: searchNode.id,
    root: baseNode.id,
    nodes: {},
  };

  makeNode(state.nodes, baseNode);

  return state;
};

const colors = [
  "#8931ef",
  "#e01946",
  "#fff800",
  "#0057e9",
  "#87e813",
  "#ff00bd",
].map((value) => {
  const color = parseToHsl(value);

  return hsl(color.hue, 0.9, 0.3);
});

export default (props: {
  value?: Expression;
  onChange: (expression: Expression) => void;
  className?: string;
}) => {
  const executionService = useContext(ExecutionContext);
  const valueRef = useRef(props.value);

  const serviceRef = useRef(executionService);
  serviceRef.current = executionService;

  const changeRef = useRef(props.onChange);
  changeRef.current = props.onChange;

  const initState = useMemo(
    () => initialState({ value: props.value, serviceRef: serviceRef }),
    [props.value]
  );

  const [state, dispatch] = useReducer(reducer, initState);

  useEffect(() => {
    if (valueRef.current !== props.value) {
      valueRef.current = props.value;
      dispatch({ type: "replace", ast: props.value });
    }
  }, [props.value]);

  useEffect(() => {
    if (state.updateType !== "external") {
      changeRef.current(getAST(state.nodes, state.root));
    }
  }, [state]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <DepthContext.Provider value={0}>
          <div tw="flex-1 v items-center justify-center">
            <div
              style={{
                fontFamily: "apl386_unicoderegular",
                backgroundColor: colors[3],
              }}
              className={props.className}
              tw="h self-center justify-center items-center rounded-sm"
            >
              <ExpressionDisplay id={state.root} />
            </div>
          </div>
        </DepthContext.Provider>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
};

type DisplayProps<T> = { node: Expr<T> } & {
  dispatch: (event: UpdateEvent) => void;
};

const base = parseToHsl(colors[3]);
const lightnessGap = 0.1;

function isOperatorExpression(
  state: State,
  node: Expression
): node is Expr<"group"> {
  if (node.type === "group" && node.children.length === 3) {
    const operator = state.nodes[node.children[1]];

    return (
      !!operator &&
      operator.type === "keyword" &&
      getTypes(state.getService(), operator).some(
        (value) => value === "dyad" || value === "conjunction"
      )
    );
  }

  return false;
}

function getBackground(depth: number) {
  return colors[depth % 6];
  /*
  if (depth % 6 >= 3) {
    return `hsl(${base.hue}, ${base.saturation * 100}%, ${
      (base.lightness + (6 - (depth % 6)) * lightnessGap) * 100
    }%)`;
  }

  return `hsl(${base.hue}, ${base.saturation * 100}%, ${
    (base.lightness + (depth % 6) * lightnessGap) * 100
  }%)`;
  */
}

function flattenOperators(state: State, node: Expression): string[] {
  if (isOperatorExpression(state, node)) {
    const operator = state.nodes[node.children[1]] as Expr<"keyword">;
    const left = state.nodes[node.children[0]];
    if (isOperatorExpression(state, left)) {
      const leftOperator = state.nodes[left.children[1]];

      if (
        leftOperator.type === "keyword" &&
        leftOperator.keyword === operator.keyword
      ) {
        return [
          ...flattenOperators(state, left),
          operator.id,
          node.children[2],
        ];
      }
    }

    return node.children;
  }

  return [node.id];
}

function ExpressionDisplay(props: { id: string }) {
  const dispatch = useContext(DispatchContext);
  const state = useContext(StateContext);

  const node = state.nodes[props.id];
  const flattened = flattenOperators(state, node);

  if (flattened.length > 1) {
    return <FlattenedGroupDisplay nodes={flattened}></FlattenedGroupDisplay>;
  }

  if (node) {
    if (node.type === "search") {
      return <SearchDisplay node={node} dispatch={dispatch} />;
    } else if (node.type === "group") {
      return <GroupDisplay node={node} dispatch={dispatch} />;
    } else if (node.type === "keyword") {
      return <KeywordDisplay node={node} dispatch={dispatch} />;
    } else if (node.type === "number") {
      return <NumberDisplay node={node} dispatch={dispatch} />;
    } else if (node.type === "reference") {
      return <RefDisplay node={node} dispatch={dispatch} />;
    }
  }

  return <div>null</div>;
}

function KeywordDisplay(props: DisplayProps<"keyword">) {
  return (
    <div tw="white-space[pre]" className="text">
      {props.node.keyword.replace(" ", " ")}
    </div>
  );
}

function RefDisplay(props: DisplayProps<"reference">) {
  const service = useContext(ExecutionContext);
  const node = service.getReference(props.node.reference);

  return <div className="text">{node._label}</div>;
}

function NumberDisplay(props: DisplayProps<"number">) {
  return <div className="text">{props.node.value}</div>;
}

function GroupWrapper(props: { focused?: boolean; children: React.ReactNode }) {
  const depth = useContext(DepthContext);

  return (
    <div
      className="group"
      style={
        props.focused
          ? { backgroundColor: "white", color: "black" }
          : { backgroundColor: getBackground(depth), color: "white" }
      }
      css={[
        css`
          .group + .group {
            margin-right: 2px;
          }

          .text + .gruop {
            margin-right: 2px;
          }

          .group + .text {
            margin-left: 2px;
          }
        `,
      ]}
      tw="h items-center self-stretch padding[2px] rounded-sm text-lg leading-none"
    >
      <DepthContext.Provider value={depth + 1}>
        {props.children}
      </DepthContext.Provider>
    </div>
  );
}

function FlattenedGroupDisplay(props: { nodes: string[] }) {
  return (
    <GroupWrapper>
      {props.nodes.map((value) => {
        return <ExpressionDisplay key={value} id={value}></ExpressionDisplay>;
      })}
    </GroupWrapper>
  );
}

function GroupDisplay(props: DisplayProps<"group">) {
  const state = useContext(StateContext);
  const isFocused = props.node.children.includes(state.focus);

  return (
    <GroupWrapper focused={isFocused}>
      {props.node.children.map((value) => {
        return <ExpressionDisplay key={value} id={value}></ExpressionDisplay>;
      })}
    </GroupWrapper>
  );
}

function SearchDisplay(props: DisplayProps<"search">) {
  const service = useContext(ExecutionContext);
  const names =
    props.node.value.length > 0 ? service.searchNames(props.node.value) : [];

  return (
    <div
      tw="relative"
      css={css`
        input {
          background-color: transparent;
          min-width: 8px;
          text-align: center;
          line-height: 0;

          &:focus,
          &:active {
            outline: none;
            box-shadow: none !important;
          }
        }
      `}
    >
      <AutosizeInput
        tw="bg-transparent leading-none"
        autoFocus
        value={props.node.value}
        onKeyDown={(e) => {
          if (e.key === "(") {
            e.preventDefault();
            props.dispatch({ type: "search.insert_group" });
          } else if (e.key === " ") {
            console.log(e.key);
            e.preventDefault();
            props.dispatch({ type: "search.close_group" });
          } else if (e.key === ")") {
            e.preventDefault();
            props.dispatch({ type: "search.close_group" });
          } else if (e.key === "Enter" && names.length > 0) {
            e.preventDefault();
            const reference = names[0];

            if (reference.type === "node") {
              props.dispatch({
                type: "search.reference",
                reference: reference.node._id,
              });
            }
          }
        }}
        onBlur={(e) => {
          props.dispatch({ type: "search.blur" });
        }}
        onChange={(e) =>
          props.dispatch({ type: "search", value: e.currentTarget.value })
        }
      />

      {names.length > 0 && (
        <div tw="v grid grid-template-columns[2em 1fr] color[white] rounded margin-left[calc(-1.4em - 9px)] border border-gray-700 absolute top[calc(100% + 8px)] text-sm mt-1 background-color[rgba(255, 255, 255, 0.1)]">
          {names.slice(0, 14).map((node) => {
            return node.type === "node" ? (
              <React.Fragment key={node.node._id}>
                <div></div>
                <div>{node.name}</div>
              </React.Fragment>
            ) : (
              <React.Fragment key={node.name}>
                <div tw="mr-2 text-center text-base text-yellow-400 bg-gray-700">
                  {node.symbol}
                </div>
                <div tw="white-space[pre]">{node.name}</div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
