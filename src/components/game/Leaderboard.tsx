"use client";

import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTopScores } from '@/services/leaderboardService';
import type { LeaderboardEntry } from '@/types/game';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, RefreshCw, ListOrdered } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const Leaderboard: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const queryClient = useQueryClient();
  const { data: scores, isLoading, error, refetch } = useQuery<LeaderboardEntry[], Error>({
    queryKey: ['leaderboard'],
    queryFn: () => getTopScores(10),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (refreshTrigger !== undefined) {
       queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    }
  }, [refreshTrigger, queryClient]);


  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <ListOrdered className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="Refresh leaderboard">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-1/5 ml-auto" />
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-destructive text-center py-4">Error: {error.message}</p>}
        {!isLoading && !error && (!scores || scores.length === 0) && (
          <p className="text-muted-foreground text-center py-4">No scores yet. Be the first!</p>
        )}
        {!isLoading && !error && scores && scores.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map((entry, index) => (
                <TableRow key={entry.id} className={index === 0 ? 'bg-accent/10 hover:bg-accent/20' : ''}>
                  <TableCell className="font-medium text-center">
                    {index === 0 ? <Award className="h-5 w-5 inline-block text-accent" /> : index + 1}
                  </TableCell>
                  <TableCell className="truncate max-w-[100px] sm:max-w-xs">{entry.name}</TableCell>
                  <TableCell className="text-right font-semibold">{entry.score}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                    {entry.timestamp ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true }) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {scores.length === 0 && <TableCaption>No scores recorded yet.</TableCaption>}
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
