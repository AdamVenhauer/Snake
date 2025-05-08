import { db } from '@/firebase/config';
import type { LeaderboardEntry } from '@/types/game';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

const LEADERBOARD_COLLECTION = 'leaderboard';

export async function addScore(name: string, score: number): Promise<void> {
  try {
    await addDoc(collection(db, LEADERBOARD_COLLECTION), {
      name,
      score,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding score to leaderboard: ", error);
    throw new Error('Failed to submit score.');
  }
}

export async function getTopScores(count: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy('score', 'desc'),
      orderBy('timestamp', 'asc'), // Secondary sort for ties
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    const scores: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      scores.push({
        id: doc.id,
        name: data.name,
        score: data.score,
        timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(), // Handle null or convert Timestamp
      });
    });
    return scores;
  } catch (error) {
    console.error("Error fetching top scores: ", error);
    throw new Error('Failed to fetch leaderboard scores.');
  }
}
