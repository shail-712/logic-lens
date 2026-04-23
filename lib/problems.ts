import type { Problem } from '../types';

export const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description:
      'Given an array of integers and a target, return indices of two numbers that add up to the target.',
  },
  {
    id: 2,
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'Arrays',
    description: 'Implement binary search on a sorted array.',
  },
  {
    id: 3,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks',
    description: 'Check if a string of brackets is valid.',
  },
  {
    id: 4,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'Arrays',
    description: 'Merge all overlapping intervals in a list.',
  },
  {
    id: 5,
    title: 'Sliding Window Maximum',
    difficulty: 'Medium',
    category: 'Sliding Window',
    description: 'Find the maximum in every window of size k.',
  },
  {
    id: 6,
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Design',
    description: 'Design a data structure that follows LRU cache eviction.',
  },
  {
    id: 7,
    title: 'Word Ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    description: 'Find the shortest transformation sequence between two words.',
  },
  {
    id: 8,
    title: 'Serialize Binary Tree',
    difficulty: 'Hard',
    category: 'Trees',
    description: 'Design an algorithm to serialize and deserialize a binary tree.',
  },
];

export function getRandomProblem(): Problem {
  return PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
}

