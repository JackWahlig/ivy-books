export interface UserRankingInput {
  uid: string;
  rankedList: string[];
}

export interface BookScore {
  bookId: string;
  score: number;
  controversy: number;
  voteCount: number;
}

export function computeConsensus(
  allUserPrefs: UserRankingInput[],
  bookIds: string[],
): BookScore[] {
  return bookIds
    .map((bookId) => {
      // Collect ranks assigned to this book by each user who ranked it
      // Rank 1 = top choice (index 0), so we use (index + 1) as the rank value
      const ranks: number[] = allUserPrefs
        .map((user) => {
          const index = user.rankedList.indexOf(bookId);
          return index === -1 ? null : index + 1;
        })
        .filter((r): r is number => r !== null);

      if (ranks.length === 0) {
        return { bookId, score: 0, controversy: 0, voteCount: 0 };
      }

      const voteCount = ranks.length;
      const mean = ranks.reduce((sum, r) => sum + r, 0) / voteCount;

      // Normalize score to 0-100: lower average rank = higher score
      // We use the total number of books as the max possible rank
      const maxRank = bookIds.length;
      const score = Math.round(
        (1 - (mean - 1) / Math.max(maxRank - 1, 1)) * 100,
      );

      // Controversy = standard deviation of ranks
      // High stddev means users disagree strongly about this book
      const variance =
        ranks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / voteCount;
      const controversy = Math.round(Math.sqrt(variance) * 10) / 10;

      return { bookId, score, controversy, voteCount };
    })
    .sort((a, b) => {
      // Books with fewer than 2 votes always sort to the bottom
      const aInsufficient = a.voteCount < 2;
      const bInsufficient = b.voteCount < 2;

      if (aInsufficient && bInsufficient) return b.voteCount - a.voteCount;
      if (aInsufficient) return 1;
      if (bInsufficient) return -1;

      // Both have enough votes — sort by score descending
      return b.score - a.score;
    });
}
