import { Expression } from "../data/documents";
import * as bs from "@babel/standalone";
import type * as babelt from "@babel/core";
import * as types from "@babel/types";
import { ExecutionContext } from "../components/ExecutionContext";
import { Ctx } from "./symbols";

const babel = bs as any as typeof babelt;
const t = types;
const generate = (bs as any).generate;

type SymbolSet = Partial<Record<ESymbol["type"], ESymbol>>;

type ESymbol = {
  type: "dyad" | "noun" | "monad" | "conjunction" | "adverb";
  impl: (context: Ctx, ...args: SymbolSet[]) => SymbolSet;
  unwrap?: (context: Ctx) => babel.types.Expression;
};

const binary = (operator: any) => (ctx: Ctx, a: SymbolSet, b: SymbolSet) => {
  return nounDyad((ctx, a, b) => {
    return t.binaryExpression(operator, a, b);
  }).impl(ctx, a, b);
};

const symbols = (...symbol: ESymbol[]): SymbolSet => {
  return Object.fromEntries(symbol.map((value) => [value.type, value]));
};

const noun = (expression: babel.types.Expression): ESymbol => {
  const self: ESymbol = {
    type: "noun",
    impl() {
      return symbols(self);
    },
    unwrap() {
      return expression;
    },
  };

  return self;
};

const nounDyad = (
  make: (
    ctx: Ctx,
    x: babel.types.Expression,
    y: babel.types.Expression
  ) => babel.types.Expression
) => {
  function applyIfMonad(ctx: Ctx, dyadArg: SymbolSet, noun: SymbolSet) {
    if (dyadArg.monad) {
      return dyadArg.monad.impl(ctx, noun).noun!.unwrap(ctx);
    }

    return dyadArg.noun!.unwrap(ctx);
  }

  const self: ESymbol = {
    type: "dyad",
    impl(ctx, x, y) {
      if (x.monad || y.monad) {
        return symbols(
          monad((ctx, y1) => {
            return symbols(
              noun(
                make(ctx, applyIfMonad(ctx, x, y1), applyIfMonad(ctx, y, y1))
              )
            );
          })
        );
      }

      return symbols(noun(make(ctx, x.noun!.unwrap(ctx), y.noun!.unwrap(ctx))));
    },
    unwrap() {
      throw new Error("cannot unwrap monad");
    },
  };

  return self;
};

const monad = (make: (ctx: Ctx, y: SymbolSet) => SymbolSet): ESymbol => {
  const self: ESymbol = {
    type: "monad",
    impl(ctx, y) {
      return make(ctx, y);
    },
    unwrap() {
      throw new Error("cannot unwrap monad");
    },
  };

  return self;
};

type KeywordType = {
  name: string;
  alias?: string[];
  type: ESymbol["type"];
  impl?: (context: Ctx, ...args: SymbolSet[]) => SymbolSet;
  unwrap?: (context: Ctx) => babel.types.Expression;
};

export const keywords: Record<string, { types: KeywordType[] }> = {
  "#": {
    types: [
      {
        name: "identity",
        alias: ["same"],
        type: "monad",
        impl: (ctx, a: SymbolSet) => a,
      },
    ],
  },

  " ": {
    types: [
      {
        name: "pipeline",
        type: "conjunction",
        impl: (ctx, a, b) => {
          if (a.noun && b.monad) {
            return b.monad.impl(ctx, a);
          }

          return symbols(
            monad((ctx, y) => {
              return b.monad!.impl(ctx, a.monad!.impl(ctx, y));
            })
          );
        },
      },
    ],
  },

  "*": {
    types: [
      {
        name: "product",
        alias: ["multiply", "times"],
        type: "dyad",
        impl: binary("*"),
      },
    ],
  },

  "<.": {
    types: [
      {
        name: "floor",
        type: "monad",
        impl: (ctx, y) => {
          return symbols(
            noun(
              t.callExpression(
                t.memberExpression(t.identifier("Math"), t.identifier("floor")),
                [y.noun!.unwrap(ctx)]
              )
            )
          );
        },
      },
    ],
  },

  "+": {
    types: [
      {
        name: "sum",
        alias: ["add", "plus"],
        type: "dyad",
        impl: binary("+"),
      },
    ],
  },

  "/": {
    types: [
      {
        name: "quotient",
        alias: ["divide"],
        type: "dyad",
        impl: binary("/"),
      },

      {
        name: "reciprocal",
        alias: ["inverse"],
        type: "monad",
      },
    ],
  },

  "-": {
    types: [
      {
        name: "negate",
        type: "monad",
      },

      {
        name: "difference",
        alias: ["subtract", "minus"],
        type: "dyad",
        impl: binary("-"),
      },
    ],
  },

  "@": {
    types: [
      {
        name: "insert",
        alias: ["reduce", "together"],
        type: "adverb",
      },
    ],
  },

  "[": {
    types: [
      {
        name: "first",
        alias: ["head"],
        type: "monad",
      },

      {
        name: "take",
        type: "dyad",
      },
    ],
  },

  "]": {
    types: [
      {
        name: "last",
        type: "monad",
      },

      {
        name: "take_last",
        type: "dyad",
      },
    ],
  },

  "]:": {
    types: [
      {
        name: "tail",
        type: "monad",
      },
      {
        name: "drop",
        type: "dyad",
      },
    ],
  },

  "[.": {
    types: [
      {
        name: "nth",
        type: "dyad",
      },
    ],
  },

  "+:": {
    types: [
      {
        name: "integers",
        type: "monad",
      },
      {
        name: "range",
        type: "dyad",
      },
    ],
  },
};

const buildKeywordTree = () => {
  const entries = Object.entries(keywords);

  const index = [];
  for (const [keyword, input] of entries) {
    const codes = keyword.split("").map((value) => value.charCodeAt(0));
    const value = {
      ...input,
      keyword,
    };

    let currentIndex = index;
    for (const code of codes) {
      if (currentIndex[code] == null) {
        currentIndex[code] = [];
      }

      currentIndex = currentIndex[code];
    }

    currentIndex[128] = value;
  }

  return index;
};

const keywordTree = buildKeywordTree();

const [minNum, maxNum] = ["0".charCodeAt(0), "9".charCodeAt(0)].sort(
  (a, b) => a - b
);

const [minAlphaLower, maxAlphaLower] = [
  "a".charCodeAt(0),
  "z".charCodeAt(0),
].sort((a, b) => a - b);
const [minAlphaUpper, maxAlphaUpper] = [
  "A".charCodeAt(0),
  "Z".charCodeAt(0),
].sort((a, b) => a - b);
export const isLowerAlpha = (code: number) => {
  return code >= minAlphaLower && code <= maxAlphaLower;
};

export const isUpperAlpha = (code: number) => {
  return code >= minAlphaUpper && code <= maxAlphaUpper;
};

export const isAlpha = (code: number) =>
  isLowerAlpha(code) || isUpperAlpha(code);

export const isNumCode = (code: number) => {
  return code >= minNum && code <= maxNum;
};

const codes = {
  dot: ".".charCodeAt(0),
};

export const tokenize = (source: string) => {
  let char = 0;
  const tokens: Token[] = [];

  function code(i: number = 0) {
    return source.charCodeAt(char + i);
  }

  let i = 0;
  nexttoken: for (char = 0; char < source.length; ) {
    i++;
    if (i > 1000) {
      throw new Error("uhm");
    }

    const current = code();

    if (keywordTree[current]) {
      let advance = 1;
      let index = keywordTree[current];
      do {
        if (index[code(advance)]) {
          index = index[code(advance)];
          advance += 1;
        } else {
          break;
        }
      } while (true);

      if (index[128]) {
        char += advance;
        tokens.push({ type: "keyword", keyword: index[128].keyword });
        continue nexttoken;
      }
    }

    if (isNumCode(current)) {
      let advance = 1;
      let numChars = [String.fromCharCode(current)];

      while (true) {
        if (isNumCode(code(advance)) || code(advance) === codes.dot) {
          numChars.push(String.fromCharCode(code(advance)));
          advance += 1;
        } else {
          break;
        }
      }

      tokens.push({ type: "number", value: parseFloat(numChars.join("")) });
      char += advance;
      continue nexttoken;
    }

    if (isLowerAlpha(current)) {
      let advance = 1;
      let chars = [String.fromCharCode(current)];

      while (true) {
        if (isAlpha(code(advance)) || isNumCode(code(advance))) {
          chars.push(String.fromCharCode(code(advance)));
          advance += 1;
        } else {
          break;
        }
      }

      tokens.push({ type: "identifier", value: chars.join("") });
      char += advance;
      continue nexttoken;
    }

    throw new Error(
      `unexpected char ${current} :: '${String.fromCharCode(current)}'`
    );
  }

  return tokens;
};

export type Token =
  | {
      type: "keyword";
      keyword: string;
    }
  | { type: "identifier"; value: string }
  | {
      type: "number";
      value: number;
    }
  | { type: "reference"; reference: string }
  | { type: "search"; value: string };

export type StubToken = { type: "stub"; types: string[]; index: number };
export type GroupableToken = (GroupToken | StubToken | Token) & {
  _search?: string;
};

const patterns = Object.entries({
  "monad dyad monad": "monad",
  "noun dyad noun": "noun",
  "noun dyad monad": "monad",
  "monad dyad noun": "monad",
  "monad noun": "noun",
  "monad adverb": ["monad", "dyad"],
  "dyad adverb": ["monad", "dyad"],
  "dyad monad": ["monad", "dyad"],
  "noun conjunction monad": ["noun"],
  "monad conjunction monad": ["monad"],
}).map(([pattern, value]) => {
  return {
    pattern: pattern.split(" "),
    types: Array.isArray(value) ? value : [value],
  };
});

export type GroupToken = {
  type: "group";
  children: GroupableToken[];
  types: string[];
};

export const printTokens = (tokens: Token[]) => {
  return tokens
    .map((token) => {
      if (token.type === "number") {
        return String(token.value);
      }

      if (token.type === "keyword") {
        return token.keyword;
      }

      if (token.type === "identifier") {
        return token.value;
      }

      throw new Error("unexpected token");
    })
    .join("");
};

export const getTypes = (
  service: ExecutionContext,
  token: GroupableToken
): string[] => {
  if (token.type === "keyword") {
    return keywords[token.keyword].types.map((type) => type.type);
  }

  if (token.type === "number") {
    return ["noun"];
  }

  if (token.type === "group") {
    return (
      token.types ?? (group(service, token.children as any)[0] as any).types
    );
  }

  if (token.type == "stub") {
    return token.types;
  }

  if (token.type == "reference") {
    const node = service.getReference(token.reference);
    return getTypes(service, node.expression);
  }

  return [];
};

export const group = (service: ExecutionContext, tokens: GroupableToken[]) => {
  const group = (tokens: GroupableToken[]): GroupableToken[] => {
    tokens = tokens.flatMap((token) =>
      token.type === "search"
        ? (tokenize(token.value).map((value: GroupableToken, i, tokens) => {
            if (i === tokens.length - 1) {
              value._search = (token as any).id;
            }
            return value;
          }) as GroupableToken[])
        : [token]
    );

    const step = match(tokens);

    if (step == null) {
      return tokens;
    }

    if (step.length === 1) {
      return step;
    }

    return group(step);
  };

  const match = (tokens: GroupableToken[]): GroupableToken[] | null => {
    nextpattern: for (const { pattern, types } of patterns) {
      if (pattern.length > tokens.length) {
        continue;
      }

      for (let i = 0; i < pattern.length; i++) {
        if (!getTypes(service, tokens[i]).includes(pattern[i])) {
          continue nextpattern;
        }
      }

      return [
        {
          type: "group",
          types: types,
          children: tokens.slice(0, pattern.length),
        },
        ...tokens.slice(pattern.length),
      ];
    }

    return null;
  };

  return group(tokens);
};

export const interpret = (expressions: Record<string, Expression>) => {
  const results: Record<string, any> = {};

  const getExpressionSymbols = (
    ctx: Ctx,
    expression: Expression
  ): SymbolSet => {
    try {
      if (expression.type === "group" && expression.children.length === 3) {
        const { dyad, conjunction } = getExpressionSymbols(
          ctx,
          expression.children[1]
        );
        const left = getExpressionSymbols(ctx, expression.children[0]);
        const right = getExpressionSymbols(ctx, expression.children[2]);
        const symbol = dyad || conjunction;

        if (symbol) {
          return symbol.impl(ctx, left, right);
        }
      }

      if (expression.type === "group" && expression.children.length === 2) {
        return getExpressionSymbols(ctx, expression.children[0]).monad!.impl(
          ctx,
          getExpressionSymbols(ctx, expression.children[1])
        );
      }

      if (expression.type === "keyword") {
        return symbols(
          ...(keywords[expression.keyword].types.filter(
            (value) => value.impl
          ) as any)
        );
      }

      if (expression.type === "reference") {
        return evaluate(expression.reference);
      }

      if (expression.type === "number") {
        return symbols(noun(t.numericLiteral(expression.value)));
      }

      throw new Error(`could not compile ${JSON.stringify(expression)}`);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const ctx: Ctx = {
    get(id: string) {
      return evaluate(id);
    },
  };

  const syms = {};

  const evaluate = (id: string) => {
    if (syms[id]) {
      return syms[id];
    }

    const expression = expressions[id];
    const symbol = getExpressionSymbols(ctx, expression);
    syms[id] = symbol;

    return symbol;
  };

  for (const id of Object.keys(expressions)) {
    const symbol = evaluate(id);

    if (symbol && symbol.noun) {
      const ast = symbol.noun.unwrap(ctx);
      const source = (bs as any).transformFromAst(
        t.program([t.returnStatement(ast)]),
        undefined,
        {}
      );
      console.log(source.code);
      try {
        const result = new Function(source.code)();
        results[id] = result;
      } catch (e) {
        console.error(e);
      }
    }
  }

  return results;
};
