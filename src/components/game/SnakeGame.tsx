"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useSnakeGameLogic } from '@/hooks/useSnakeGameLogic';
import type { Point, Maze } from '@/types/game';
import { CellType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CELL_SIZE = 20; // pixels
const GAME_SPEED = 120; // milliseconds

// Helper to get HSL string from CSS variables
const getCssVariableValue = (variableName: string): string => {
  if (typeof window === 'undefined') return ''; // Default for SSR
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};


const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
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
  } = useSnakeGameLogic();

  const { toast } = useToast();
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Colors from CSS variables
  const [colors, setColors] = React.useState({
    snakeColor: '',
    foodColor: '',
    wallColor: '',
    pathColor: '',
    gridColor: ''
  });

  useEffect(() => {
    // Ensure this runs only on the client
    setColors({
      snakeColor: `hsl(${getCssVariableValue('--primary')})`,
      foodColor: `hsl(${getCssVariableValue('--accent')})`,
      wallColor: `hsl(${getCssVariableValue('--secondary')})`,
      pathColor: `hsl(${getCssVariableValue('--card')})`,
      gridColor: `hsl(${getCssVariableValue('--border')})`
    });
  }, []);


  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors.snakeColor) return; // Ensure colors are loaded
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas (draw path color)
    ctx.fillStyle = colors.pathColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (optional, for better visual separation)
    ctx.strokeStyle = colors.gridColor; // A subtle grid line color
    ctx.lineWidth = 0.5;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    
    // Draw maze walls
    ctx.fillStyle = colors.wallColor;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (maze[r] && maze[r][c] === CellType.WALL) {
          ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw snake
    ctx.fillStyle = colors.snakeColor;
    snake.forEach(segment => {
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      // Add a slight border to snake segments for definition
      ctx.strokeStyle = colors.pathColor; 
      ctx.lineWidth = 1;
      ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw food
    ctx.fillStyle = colors.foodColor;
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2.5, // Smaller radius for food
        0,
        2 * Math.PI
    );
    ctx.fill();
    // Add a slight border to food
    ctx.strokeStyle = colors.pathColor;
    ctx.lineWidth = 1;
    ctx.stroke();


  }, [snake, food, maze, GRID_ROWS, GRID_COLS, colors]);

  useEffect(() => {
    drawGame();
  }, [drawGame, snake, food, maze]); // Redraw when game elements change

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver) {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
      toast({
        title: "Game Over!",
        description: `Your score: ${score}. Press R to restart.`,
        variant: "destructive",
      });
      return;
    }

    if (isPaused) {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
      return;
    }

    if (gameLoopIntervalRef.current) {
      clearInterval(gameLoopIntervalRef.current);
    }
    gameLoopIntervalRef.current = setInterval(updateGame, GAME_SPEED);

    return () => {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
    };
  }, [gameOver, isPaused, score, toast, updateGame]);

  return (
    <Card className="w-full max-w-max shadow-2xl overflow-hidden rounded-xl border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
        <CardTitle className="text-2xl font-semibold text-primary">Score: {score}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} aria-label={isPaused ? "Play" : "Pause"}>
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={resetGame} aria-label="Restart Game">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative"> {/* p-0 to remove default padding and let canvas take full space */}
        <canvas
          ref={canvasRef}
          width={GRID_COLS * CELL_SIZE}
          height={GRID_ROWS * CELL_SIZE}
          className="border border-border bg-card"
          style={{ imageRendering: 'pixelated' }} // For crisp pixels
        />
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center p-6 bg-card rounded-lg shadow-xl">
              {gameOver && <p className="text-4xl font-bold text-destructive mb-4">Game Over!</p>}
              {isPaused && !gameOver && <p className="text-4xl font-bold text-primary mb-4">Paused</p>}
              <p className="text-xl text-foreground mb-4">Score: {score}</p>
              <Button onClick={resetGame} className="mt-2 text-lg px-6 py-3">
                <RotateCcw className="mr-2 h-5 w-5" />
                {gameOver ? "Play Again" : "Restart"}
              </Button>
              {isPaused && !gameOver && (
                <Button onClick={() => setIsPaused(false)} className="mt-2 ml-2 text-lg px-6 py-3" variant="secondary">
                  <Play className="mr-2 h-5 w-5" />
                  Resume
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter className="p-4 bg-muted/50 text-center">
         <CardDescription className="w-full">
           {isPaused && !gameOver ? "Game Paused. Press P to resume." : "Navigate the snake and eat the golden dots!"}
         </CardDescription>
       </CardFooter>
    </Card>
  );
};

export default SnakeGame;
