import SnakeGame from '@/components/game/SnakeGame';
import { Gamepad2 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 selection:bg-primary/30">
      <div className="flex items-center space-x-3 mb-8">
        <Gamepad2 className="h-10 w-10 text-primary" />
        <h1 className="text-5xl font-bold text-primary tracking-tight">
          Serpentine Maze
        </h1>
      </div>
      
      <SnakeGame />
      
      <footer className="mt-8 text-sm text-muted-foreground text-center">
        <p>Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> to move the snake.</p>
        <p>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">R</kbd> to restart the game.</p>
      </footer>
    </main>
  );
}
