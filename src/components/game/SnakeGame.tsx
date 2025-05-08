"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSnakeGameLogic } from '@/hooks/useSnakeGameLogic';
import type { Point, Maze } from '@/types/game';
import { CellType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SubmitScoreForm from './SubmitScoreForm';
import { addScore } from '@/services/leaderboardService';
import { useQueryClient } from '@tanstack/react-query';

const CELL_SIZE = 20; // pixels
const GAME_SPEED = 120; // milliseconds

const getCssVariableValue = (variableName: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};

const SnakeGame: React.FC<{ onScoreSubmit?: () => void }> = ({ onScoreSubmit }) => {
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
    resetGame: logicResetGame,
    isPaused,
    setIsPaused,
  } = useSnakeGameLogic();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showSubmitScoreForm, setShowSubmitScoreForm] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const [colors, setColors] = React.useState({
    snakeColor: '',
    foodColor: '',
    wallColor: '',
    pathColor: '',
    gridColor: ''
  });

  useEffect(() => {
    setColors({
      snakeColor: `hsl(${getCssVariableValue('--primary')})`,
      foodColor: `hsl(${getCssVariableValue('--accent')})`,
      wallColor: `hsl(${getCssVariableValue('--secondary')})`,
      pathColor: `hsl(${getCssVariableValue('--card')})`,
      gridColor: `hsl(${getCssVariableValue('--border')})`
    });
  }, []);

  const resetGame = useCallback(() => {
    logicResetGame();
    setShowSubmitScoreForm(false);
    setScoreSubmitted(false);
  }, [logicResetGame]);

  const handleScoreSubmit = async (name: string) => {
    if (score > 0) {
      try {
        await addScore(name, score);
        toast({
          title: "Score Submitted!",
          description: `Thanks, ${name}! Your score of ${score} is on the board.`,
        });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        if (onScoreSubmit) onScoreSubmit();
      } catch (err) {
        toast({
          title: "Submission Failed",
          description: (err as Error).message || "Could not submit your score.",
          variant: "destructive",
        });
      }
    }
    setScoreSubmitted(true);
    setShowSubmitScoreForm(false);
  };
  
  const handleSkipSubmit = () => {
    setScoreSubmitted(true);
    setShowSubmitScoreForm(false);
  }

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors.snakeColor) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = colors.pathColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 0.5;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    
    ctx.fillStyle = colors.wallColor;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (maze[r] && maze[r][c] === CellType.WALL) {
          ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    ctx.fillStyle = colors.snakeColor;
    snake.forEach(segment => {
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = colors.pathColor; 
      ctx.lineWidth = 1;
      ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    ctx.fillStyle = colors.foodColor;
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2.5,
        0,
        2 * Math.PI
    );
    ctx.fill();
    ctx.strokeStyle = colors.pathColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [snake, food, maze, GRID_ROWS, GRID_COLS, colors]);

  useEffect(() => {
    drawGame();
  }, [drawGame, snake, food, maze]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      // Prevent arrow keys from scrolling the page when game is active
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !gameOver && !isPaused) {
        e.preventDefault();
      }
      // Only allow game-specific keys (arrows, R, P) if not in submit score form
      if (!showSubmitScoreForm) {
        handleKeyDown(e);
      } else if (e.key === 'Escape') { // Allow Esc to close submit form
        handleSkipSubmit();
      }
    };
    window.addEventListener('keydown', keydownHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
    };
  }, [handleKeyDown, gameOver, isPaused, showSubmitScoreForm]);

  useEffect(() => {
    if (gameOver) {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
      if (score > 0 && !scoreSubmitted) {
        setShowSubmitScoreForm(true);
      } else {
        // Game over UI is handled by JSX based on `gameOver` and `showSubmitScoreForm` state.
        // No need for an additional toast here if score is 0 or already submitted.
      }
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
  }, [gameOver, isPaused, score, scoreSubmitted, updateGame]);

  return (
    <Card className="w-full max-w-max shadow-2xl overflow-hidden rounded-xl border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
        <CardTitle className="text-2xl font-semibold text-primary">Score: {score}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} aria-label={isPaused ? "Play" : "Pause"} disabled={gameOver || showSubmitScoreForm}>
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={resetGame} aria-label="Restart Game" disabled={showSubmitScoreForm}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <canvas
          ref={canvasRef}
          width={GRID_COLS * CELL_SIZE}
          height={GRID_ROWS * CELL_SIZE}
          className="border border-border bg-card"
          style={{ imageRendering: 'pixelated' }}
          tabIndex={0} // Make canvas focusable for key events
        />
        {(gameOver || isPaused || showSubmitScoreForm) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            {showSubmitScoreForm && score > 0 && !scoreSubmitted && (
              <SubmitScoreForm score={score} onSubmit={handleScoreSubmit} onCancel={handleSkipSubmit} />
            )}
            {gameOver && !showSubmitScoreForm && (
              <div className="text-center p-6 bg-card rounded-lg shadow-xl">
                <p className="text-4xl font-bold text-destructive mb-4">Game Over!</p>
                <p className="text-xl text-foreground mb-4">Score: {score}</p>
                <Button onClick={resetGame} className="mt-2 text-lg px-6 py-3">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Play Again
                </Button>
              </div>
            )}
            {isPaused && !gameOver && !showSubmitScoreForm && (
              <div className="text-center p-6 bg-card rounded-lg shadow-xl">
                <p className="text-4xl font-bold text-primary mb-4">Paused</p>
                 <p className="text-xl text-foreground mb-4">Score: {score}</p>
                <Button onClick={() => setIsPaused(false)} className="mt-2 text-lg px-6 py-3">
                  <Play className="mr-2 h-5 w-5" />
                  Resume
                </Button>
                 <Button onClick={resetGame} className="mt-2 ml-2 text-lg px-6 py-3" variant="secondary">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Restart
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
       <CardFooter className="p-4 bg-muted/50 text-center">
         <CardDescription className="w-full">
           {isPaused && !gameOver ? "Game Paused. Press P to resume or Esc to exit pause." : "Navigate the snake and eat the golden dots!"}
         </CardDescription>
       </CardFooter>
    </Card>
  );
};

export default SnakeGame;
