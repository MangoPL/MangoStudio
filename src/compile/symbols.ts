import { EInstance } from "./categories";

export type SymbolSet = Partial<Record<ESymbol["type"], ESymbol>>;

export type ESymbol = {
  type: "dyad" | "noun" | "monad" | "conjunction" | "adverb";
  impl: (context: Ctx, ...args: SymbolSet[]) => SymbolSet;
  category: EInstance;
};

export type Ctx = {
  get(id: string): SymbolSet;
};

export type PreludeEntry = {
  id: string;
  type: "dyad" | "monad" | "adverb" | "conjunction";
  alias: string[];
  representation: string;
  value?: ESymbol;
};

export const prelude: PreludeEntry[] = [
  {
    id: "mango.monad.?",
    alias: ["roll"],
    representation: "?",
    type: "monad",
  },
  {
    id: "mango.monad.⌈",
    alias: ["ceiling"],
    representation: "⌈",
    type: "monad",
  },
  {
    id: "mango.monad.⌊",
    alias: ["floor"],
    representation: "⌊",
    type: "monad",
  },
  {
    id: "mango.monad.⍴",
    alias: ["shape", "rho"],
    representation: "⍴",
    type: "monad",
  },
  {
    id: "mango.monad.∼",
    alias: ["not", "tilde"],
    representation: "∼",
    type: "monad",
  },
  {
    id: "mango.monad.∣",
    alias: ["absolute value"],
    representation: "∣",
    type: "monad",
  },
  {
    id: "mango.monad.⍳",
    alias: ["index generator", "iota", "range"],
    representation: "⍳",
    type: "monad",
  },
  {
    id: "mango.monad.⋆",
    alias: ["exponential"],
    representation: "⋆",
    type: "monad",
  },
  {
    id: "mango.monad.−",
    alias: ["negation"],
    representation: "−",
    type: "monad",
  },
  {
    id: "mango.monad.+",
    alias: ["conjugate"],
    representation: "+",
    type: "monad",
  },
  {
    id: "mango.monad.×",
    alias: ["signum"],
    representation: "×",
    type: "monad",
  },
  {
    id: "mango.monad.÷",
    alias: ["reciprocal"],
    representation: "÷",
    type: "monad",
  },
  {
    id: "mango.monad.,",
    alias: ["ravel", "catenate", "laminate"],
    representation: ",",
    type: "monad",
  },
  {
    id: "mango.monad.⌹",
    alias: ["matrix inverse", "quad divide"],
    representation: "⌹",
    type: "monad",
  },
  {
    id: "mango.monad.○",
    alias: ["pi times"],
    representation: "○",
    type: "monad",
  },
  {
    id: "mango.monad.⍟",
    alias: ["logarithm"],
    representation: "⍟",
    type: "monad",
  },
  {
    id: "mango.monad.⌽",
    alias: ["reversal"],
    representation: "⌽",
    type: "monad",
  },
  {
    id: "mango.monad.⊖",
    alias: ["reversal"],
    representation: "⊖",
    type: "monad",
  },
  {
    id: "mango.monad.⍋",
    alias: ["grade up"],
    representation: "⍋",
    type: "monad",
  },
  {
    id: "mango.monad.⍒",
    alias: ["grade down"],
    representation: "⍒",
    type: "monad",
  },
  {
    id: "mango.monad.⍎",
    alias: ["execute"],
    representation: "⍎",
    type: "monad",
  },
  {
    id: "mango.monad.⍕",
    alias: ["format"],
    representation: "⍕",
    type: "monad",
  },
  {
    id: "mango.monad.⍉",
    alias: ["transpose"],
    representation: "⍉",
    type: "monad",
  },
  {
    id: "mango.monad.!",
    alias: ["factorial"],
    representation: "!",
    type: "monad",
  },
  {
    id: "mango.dyad.+",
    alias: ["add"],
    representation: "+",
    type: "dyad",
  },
  {
    id: "mango.dyad.−",
    alias: ["subtract"],
    representation: "−",
    type: "dyad",
  },
  {
    id: "mango.dyad.×",
    alias: ["multiply"],
    representation: "×",
    type: "dyad",
  },
  {
    id: "mango.dyad.÷",
    alias: ["divide"],
    representation: "÷",
    type: "dyad",
  },
  {
    id: "mango.dyad.⋆",
    alias: ["exponentiation"],
    representation: "⋆",
    type: "dyad",
  },
  {
    id: "mango.dyad.○",
    alias: ["circle"],
    representation: "○",
    type: "dyad",
  },
  {
    id: "mango.dyad.?",
    alias: ["deal"],
    representation: "?",
    type: "dyad",
  },
  {
    id: "mango.dyad.∈",
    alias: ["membership", "epsilon"],
    representation: "∈",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍷",
    alias: ["find", "epsilon underbar"],
    representation: "⍷",
    type: "dyad",
  },
  {
    id: "mango.dyad.⌈",
    alias: ["maximum", "ceiling"],
    representation: "⌈",
    type: "dyad",
  },
  {
    id: "mango.dyad.⌊",
    alias: ["minimum", "floor"],
    representation: "⌊",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍴",
    alias: ["reshape", "rho"],
    representation: "⍴",
    type: "dyad",
  },
  {
    id: "mango.dyad.↑",
    alias: ["take"],
    representation: "↑",
    type: "dyad",
  },
  {
    id: "mango.dyad.↓",
    alias: ["drop"],
    representation: "↓",
    type: "dyad",
  },
  {
    id: "mango.dyad.⊥",
    alias: ["decode"],
    representation: "⊥",
    type: "dyad",
  },
  {
    id: "mango.dyad.⊤",
    alias: ["encode"],
    representation: "⊤",
    type: "dyad",
  },
  {
    id: "mango.dyad.∣",
    alias: ["residue"],
    representation: "∣",
    type: "dyad",
  },
  {
    id: "mango.dyad.,",
    alias: ["catenation"],
    representation: ",",
    type: "dyad",
  },
  {
    id: "mango.dyad.\\",
    alias: ["expansion"],
    representation: "\\",
    type: "dyad",
  },
  {
    id: "mango.dyad./",
    alias: ["compression"],
    representation: "/",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍳",
    alias: ["index of"],
    representation: "⍳",
    type: "dyad",
  },
  {
    id: "mango.dyad.⌹",
    alias: ["matrix divide"],
    representation: "⌹",
    type: "dyad",
  },
  {
    id: "mango.dyad.⌽",
    alias: ["rotation"],
    representation: "⌽",
    type: "dyad",
  },
  {
    id: "mango.dyad.⊖",
    alias: ["rotation"],
    representation: "⊖",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍟",
    alias: ["logarithm"],
    representation: "⍟",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍕",
    alias: ["format"],
    representation: "⍕",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍉",
    alias: ["transpose"],
    representation: "⍉",
    type: "dyad",
  },
  {
    id: "mango.dyad.!",
    alias: ["combinations"],
    representation: "!",
    type: "dyad",
  },
  {
    id: "mango.dyad.¨",
    alias: ["diaeresis", "dieresis", "double-dot"],
    representation: "¨",
    type: "dyad",
  },
  {
    id: "mango.dyad.<",
    alias: ["less than"],
    representation: "<",
    type: "dyad",
  },
  {
    id: "mango.dyad.≤",
    alias: ["less than or equal"],
    representation: "≤",
    type: "dyad",
  },
  {
    id: "mango.dyad.=",
    alias: ["equal"],
    representation: "=",
    type: "dyad",
  },
  {
    id: "mango.dyad.≥",
    alias: ["greater than or equal"],
    representation: "≥",
    type: "dyad",
  },
  {
    id: "mango.dyad.>",
    alias: ["greater than"],
    representation: ">",
    type: "dyad",
  },
  {
    id: "mango.dyad.≠",
    alias: ["not equal"],
    representation: "≠",
    type: "dyad",
  },
  {
    id: "mango.dyad.∨",
    alias: ["or"],
    representation: "∨",
    type: "dyad",
  },
  {
    id: "mango.dyad.∧",
    alias: ["and"],
    representation: "∧",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍱",
    alias: ["nor"],
    representation: "⍱",
    type: "dyad",
  },
  {
    id: "mango.dyad.⍲",
    alias: ["nand"],
    representation: "⍲",
    type: "dyad",
  },
  {
    id: "mango.dyad.⊣",
    alias: ["left"],
    representation: "⊣",
    type: "dyad",
  },
  {
    id: "mango.dyad.⊢",
    alias: ["right"],
    representation: "⊢",
    type: "dyad",
  },
  {
    id: "mango.operator./",
    alias: ["reduce", "slash"],
    representation: "/",
    type: "adverb",
  },
  {
    id: "mango.operator.⌿",
    alias: ["reduce-first-axis"],
    representation: "⌿",
    type: "adverb",
  },
  {
    id: "mango.operator.\\",
    alias: ["scan", "backslash"],
    representation: "\\",
    type: "adverb",
  },
  {
    id: "mango.operator.⍀",
    alias: ["scan first axis"],
    representation: "⍀",
    type: "adverb",
  },
  {
    id: "mango.operator..",
    alias: ["inner product"],
    representation: ".",
    type: "adverb",
  },
  {
    id: "mango.operator.∘.",
    alias: ["outer product"],
    representation: "∘.",
    type: "adverb",
  },
];
