export interface Point {
  x: number;
  y: number;
}

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export enum CellType {
  EMPTY,
  SNAKE,
  FOOD,
  WALL,
}

export type Maze = CellType[][];
