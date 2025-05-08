import type { Point } from '@/types/game';
import { CellType, type Maze } from '@/types/game';

const MIN_OBSTACLE_SIZE = 1;
const MAX_OBSTACLE_SIZE = 3;

export function generateMaze(rows: number, cols: number, numObstacles: number = 5, snakeInitialHead: Point): Maze {
  const maze: Maze = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(CellType.EMPTY));

  // Create boundary walls
  for (let r = 0; r < rows; r++) {
    maze[r][0] = CellType.WALL;
    maze[r][cols - 1] = CellType.WALL;
  }
  for (let c = 0; c < cols; c++) {
    maze[0][c] = CellType.WALL;
    maze[rows - 1][c] = CellType.WALL;
  }

  // Generate random obstacles
  for (let i = 0; i < numObstacles; i++) {
    const obstacleWidth = Math.floor(Math.random() * (MAX_OBSTACLE_SIZE - MIN_OBSTACLE_SIZE + 1)) + MIN_OBSTACLE_SIZE;
    const obstacleHeight = Math.floor(Math.random() * (MAX_OBSTACLE_SIZE - MIN_OBSTACLE_SIZE + 1)) + MIN_OBSTACLE_SIZE;
    
    let r: number, c: number;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    // Try to place obstacle ensuring it's not too close to initial snake head
    do {
      r = Math.floor(Math.random() * (rows - obstacleHeight - 2)) + 1; // -2 and +1 to avoid edges
      c = Math.floor(Math.random() * (cols - obstacleWidth - 2)) + 1;
      attempts++;
      if (attempts > MAX_ATTEMPTS) break; // Prevent infinite loop
    } while (
      (Math.abs(r - snakeInitialHead.y) < MAX_OBSTACLE_SIZE + 1 && Math.abs(c - snakeInitialHead.x) < MAX_OBSTACLE_SIZE + 1) ||
      (Math.abs(r + obstacleHeight - snakeInitialHead.y) < MAX_OBSTACLE_SIZE + 1 && Math.abs(c + obstacleWidth - snakeInitialHead.x) < MAX_OBSTACLE_SIZE + 1)
    );
    
    if (attempts > MAX_ATTEMPTS) continue;


    for (let y = 0; y < obstacleHeight; y++) {
      for (let x = 0; x < obstacleWidth; x++) {
        if (maze[r + y] && maze[r + y][c + x] !== undefined) {
           // Ensure snake initial position is not overwritten by a wall
          if (r + y === snakeInitialHead.y && c + x === snakeInitialHead.x) continue;
          maze[r + y][c + x] = CellType.WALL;
        }
      }
    }
  }
  // Ensure snake's initial position is clear
  if (maze[snakeInitialHead.y] && maze[snakeInitialHead.y][snakeInitialHead.x] !== undefined) {
    maze[snakeInitialHead.y][snakeInitialHead.x] = CellType.EMPTY;
  }


  return maze;
}
