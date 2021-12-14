import { Point } from "./data/documents";

export const subtract = (a: Point, b: Point) => {
  return { x: a.x - b.x, y: a.y - b.y };
};

export const add = (a: Point, b: Point) => {
  return { x: a.x + b.x, y: a.y + b.y };
};
