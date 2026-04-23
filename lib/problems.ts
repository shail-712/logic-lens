import { Problem } from '../types';

export const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description: 'Given an array of integers and a target, return indices of two numbers that add up to the target.',
  },
  {
    id: 2,
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'Arrays',
    description: 'Implement binary search on a sorted array and return the index of the target element.',
  },
  {
    id: 3,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks',
    description: 'Check if a string of brackets is valid — every open bracket must be closed in the correct order.',
  },
  {
    id: 4,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'Arrays',
    description: 'Given an array of intervals, merge all overlapping intervals and return the result.',
  },
  {
    id: 5,
    title: 'Sliding Window',
    difficulty: 'Medium',
    category: 'Sliding Window',
    description: 'Find the maximum sum of any contiguous subarray of size k.',
  },
  {
    id: 6,
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Design',
    description: 'Design a data structure that follows the Least Recently Used (LRU) cache eviction policy.',
  },
  {
    id: 7,
    title: 'Word Ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    description: 'Find the shortest transformation sequence from beginWord to endWord, changing one letter at a time.',
  },
  {
    id: 8,
    title: 'Serialize Binary Tree',
    difficulty: 'Hard',
    category: 'Trees',
    description: 'Design an algorithm to serialize and deserialize a binary tree to/from a string.',
  },
];

export const CATEGORIES = ['Arrays', 'Stacks', 'Sliding Window', 'Design', 'Graphs', 'Trees', 'Dynamic Programming', 'Strings'];
