"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface SubmitScoreFormProps {
  score: number;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

const SubmitScoreForm: React.FC<SubmitScoreFormProps> = ({ score, onSubmit, onCancel, onSuccess }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onSuccess?.();
    } catch (submissionError) {
      setError((submissionError as Error).message || 'Failed to submit score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Trophy className="h-12 w-12 text-accent mb-2" />
        <CardTitle className="text-2xl">High Score!</CardTitle>
        <CardDescription>You scored {score} points! Enter your name to save your score.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={isSubmitting}
              aria-describedby={error ? "name-error" : undefined}
            />
            {error && <p id="name-error" className="text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Skip
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SubmitScoreForm;
