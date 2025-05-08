"use client";
import SnakeGame from '@/components/game/SnakeGame';
import Leaderboard from '@/components/game/Leaderboard';
import { Gamepad2 } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);

  const handleScoreSubmitted = () => {
    setLeaderboardRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 selection:bg-primary/30 pt-8">
      <div className="flex items-center space-x-3 mb-8">
        <Gamepad2 className="h-10 w-10 text-primary" />
        <h1 className="text-5xl font-bold text-primary tracking-tight">
          Serpentine Maze
        </h1>
      </div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex justify-center md:justify-end">
          <SnakeGame onScoreSubmit={handleScoreSubmitted} />
        </div>
        <div className="md:col-span-1">
          <Leaderboard refreshTrigger={leaderboardRefreshTrigger} />
        </div>
      </div>
      
      <footer className="mt-12 text-sm text-muted-foreground text-center">
        <p>Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> to move the snake.</p>
        <p>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">P</kbd> to pause/resume, <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">R</kbd> to restart.</p>
      </footer>
    </main>
  );
}
