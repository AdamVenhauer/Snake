// @ts-nocheck : Until types are fully fleshed out / refactored for maze generation
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Point, Maze } from '@/types/game';
import { Direction, CellType } from '@/types/game';
import { generateMaze } from '@/lib/maze';

const GRID_ROWS = 20;
const GRID_COLS = 20;
const INITIAL_SNAKE_LENGTH = 3;

const createInitialSnake = (): Point[] => {
  const head: Point = { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };
  return Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, i) => ({
    x: head.x - i,
    y: head.y,
  }));
};

const getRandomPoint = (maze: Maze, snake: Point[]): Point => {
  let point: Point;
  do {
    point = {
      x: Math.floor(Math.random() * (GRID_COLS - 2)) + 1, // Avoid walls
      y: Math.floor(Math.random() * (GRID_ROWS - 2)) + 1,
    };
  } while (
    snake.some(segment => segment.x === point.x && segment.y === point.y) ||
    (maze[point.y] && maze[point.y][point.x] === CellType.WALL)
  );
  return point;
};


export function useSnakeGameLogic() {
  const [snake, setSnake] = useState<Point[]>(createInitialSnake());
  const [food, setFood] = useState<Point>(getRandomPoint(generateMaze(GRID_ROWS, GRID_COLS, 5, snake[0]), snake));
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [maze, setMaze] = useState<Maze>(() => generateMaze(GRID_ROWS, GRID_COLS, 5, createInitialSnake()[0]));
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    const initialSnake = createInitialSnake();
    setSnake(initialSnake);
    const newMaze = generateMaze(GRID_ROWS, GRID_COLS, 7, initialSnake[0]); // More obstacles
    setMaze(newMaze);
    setFood(getRandomPoint(newMaze, initialSnake));
    setDirection(Direction.RIGHT);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  }, []);
  
  useEffect(() => {
    // Ensure food is regenerated if maze changes and food is on a wall
    if (maze[food.y] && maze[food.y][food.x] === CellType.WALL) {
      setFood(getRandomPoint(maze, snake));
    }
  }, [maze, food, snake]);


  const updateGame = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case Direction.UP:
          head.y -= 1;
          break;
        case Direction.DOWN:
          head.y += 1;
          break;
        case Direction.LEFT:
          head.x -= 1;
          break;
        case Direction.RIGHT:
          head.x += 1;
          break;
      }

      // Check wall collision
      if (
        head.x < 0 || head.x >= GRID_COLS ||
        head.y < 0 || head.y >= GRID_ROWS ||
        (maze[head.y] && maze[head.y][head.x] === CellType.WALL)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
          setGameOver(true);
          return prevSnake;
        }
      }

      newSnake.unshift(head); // Add new head

      // Check food consumption
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        setFood(getRandomPoint(maze, newSnake));
      } else {
        newSnake.pop(); // Remove tail
      }
      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, maze]);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
      resetGame();
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      setIsPaused(prev => !prev);
      return;
    }

    if (gameOver) return;

    switch (e.key) {
      case 'ArrowUp':
        if (direction !== Direction.DOWN) setDirection(Direction.UP);
        break;
      case 'ArrowDown':
        if (direction !== Direction.UP) setDirection(Direction.DOWN);
        break;
      case 'ArrowLeft':
        if (direction !== Direction.RIGHT) setDirection(Direction.LEFT);
        break;
      case 'ArrowRight':
        if (direction !== Direction.LEFT) setDirection(Direction.RIGHT);
        break;
    }
  }, [direction, gameOver, resetGame]);

  return {
    snake,
    food,
    score,
    gameOver,
    maze,
    GRID_ROWS,
    GRID_COLS,
    updateGame,
    handleKeyDown,
    resetGame,
    isPaused,
    setIsPaused,
    setGameOver,
  };
}
