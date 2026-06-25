import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-dsa-bit-manipulation',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bit-manipulation.html',
  styleUrl: './bit-manipulation.scss',
})
export class DsaBitManipulation {
  quickRef: QuickRefItem[] = [
    { name: 'AND  n & m',    type: 'operator', desc: 'Both bits must be 1 — isolate bits, check even/odd' },
    { name: 'OR   n | m',    type: 'operator', desc: 'Either bit is 1 — set a bit' },
    { name: 'XOR  n ^ m',    type: 'operator', desc: 'Exactly one bit is 1 — toggle, find unique element' },
    { name: 'NOT  ~n',       type: 'operator', desc: 'Flip all bits — ~n = -(n+1) in two\'s complement' },
    { name: 'Left shift  n<<k',  type: 'operator', desc: 'Multiply by 2^k' },
    { name: 'Right shift n>>k',  type: 'operator', desc: 'Divide by 2^k (arithmetic, preserves sign)' },
    { name: 'n & (n-1)',     type: 'syntax',   desc: 'Remove lowest set bit — power of 2 check, count set bits' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Essential Bit Tricks',
      points: [
        'n & 1: check if n is odd (last bit is 1) or even (last bit is 0).',
        'n & (n-1): clears the lowest set bit. If result is 0, n is a power of 2.',
        'n ^ n = 0: XOR with itself cancels. n ^ 0 = n: XOR with 0 is identity.',
        'n ^ m ^ m = n: XOR is its own inverse — used to find the single non-duplicate element.',
      ],
    },
    {
      heading: 'XOR Properties',
      points: [
        'Commutative: a ^ b = b ^ a. Associative: (a ^ b) ^ c = a ^ (b ^ c).',
        'Self-inverse: a ^ a = 0. Identity: a ^ 0 = a.',
        'XOR all numbers 1..n with all elements — duplicates cancel, leaving the missing number.',
        'Two numbers differ at a bit where their XOR has a 1 — used to separate two unique elements.',
      ],
    },
    {
      heading: 'Counting Set Bits (Hamming Weight)',
      points: [
        'Naive: loop 32 times, check each bit with n & 1, right-shift. O(32) = O(1).',
        'Kernighan\'s: while n; { count++; n &= n-1; } — each iteration removes one set bit. O(set bits).',
        'Built-in: some languages have popcount instructions.',
        'Hamming distance: XOR the two numbers, then count set bits of the result.',
      ],
    },
    {
      heading: 'Bit Masking',
      points: [
        'Set bit k: n | (1 << k). Clear bit k: n & ~(1 << k). Toggle bit k: n ^ (1 << k).',
        'Check bit k: (n >> k) & 1.',
        'Bitmask for subsets: iterate i from 0 to (1<<n)-1. Each i represents a subset (bit j set = element j included).',
        'Subset enumeration using bitmask: O(2^n) states, each examined in O(1) — used in DP on subsets.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core Bit Tricks',
      language: 'typescript',
      code: `// Count set bits (Hamming weight) — O(set bits)
function hammingWeight(n: number): number {
  let count = 0;
  while (n) { count++; n &= n - 1; } // remove lowest set bit each iteration
  return count;
}

// Power of 2 check — O(1)
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0; // only one bit set
}

// Single number — XOR all: duplicates cancel → O(n) O(1)
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, n) => acc ^ n, 0);
}

// Missing number in [0..n] — XOR expected with actual
function missingNumber(nums: number[]): number {
  let xor = nums.length; // start with n
  for (let i = 0; i < nums.length; i++) xor ^= i ^ nums[i];
  return xor;
}

// Reverse bits — O(32)
function reverseBits(n: number): number {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result << 1) | (n & 1);
    n >>= 1;
  }
  return result >>> 0; // unsigned right shift to handle sign
}

// Bit manipulation helpers
const setBit   = (n: number, k: number) => n | (1 << k);
const clearBit = (n: number, k: number) => n & ~(1 << k);
const toggleBit= (n: number, k: number) => n ^ (1 << k);
const checkBit = (n: number, k: number) => (n >> k) & 1;`,
    },
    {
      label: 'XOR & Subset Bitmask',
      language: 'typescript',
      code: `// Two unique numbers — XOR finds differing bit, split into two groups
function singleNumberIII(nums: number[]): number[] {
  const xor = nums.reduce((a, n) => a ^ n, 0); // xor of both unique numbers
  const diff = xor & (-xor); // isolate rightmost differing bit
  let a = 0, b = 0;
  for (const n of nums) {
    if (n & diff) a ^= n; // group by differing bit
    else b ^= n;
  }
  return [a, b];
}

// Enumerate all subsets with bitmask — O(2^n * n)
function allSubsets(nums: number[]): number[][] {
  const n = nums.length;
  const result: number[][] = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const subset: number[] = [];
    for (let i = 0; i < n; i++)
      if (mask & (1 << i)) subset.push(nums[i]); // bit i is set
    result.push(subset);
  }
  return result;
}

// Sum of all XORs of all subsets — O(n)
// Each bit contributes 2^(n-1) subsets where it's set
function subsetXORSum(nums: number[]): number {
  return nums.reduce((or, n) => or | n, 0) * (1 << (nums.length - 1));
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using == instead of === with bitwise results',
      wrong: `if ((n & 1) == true) { ... } // coerces 1 to true but style is wrong`,
      right: `if ((n & 1) === 1) { ... } // explicit, no coercion`,
      explanation: 'Bitwise expressions return numbers (0 or 1), not booleans. Use === 1 or !== 0 for explicit comparison.',
    },
    {
      title: 'Power of 2: not checking n > 0',
      wrong: `return (n & (n - 1)) === 0; // 0 passes this check (0 & -1 = 0)`,
      right: `return n > 0 && (n & (n - 1)) === 0; // 0 is NOT a power of 2`,
      explanation: '0 & (0-1) = 0 & 0xFFFF... = 0, which would incorrectly return true. Always guard with n > 0.',
    },
    {
      title: 'Reversing bits: not using unsigned right shift for the result',
      wrong: `return result; // may be negative in JS due to 32-bit signed integer handling`,
      right: `return result >>> 0; // unsigned right shift converts to unsigned 32-bit integer`,
      explanation: 'JavaScript bitwise ops work on signed 32-bit integers. >>> 0 converts the result to unsigned 32-bit, which is what bit reversal problems expect.',
    },
    {
      title: 'XOR for missing number: forgetting to XOR with n',
      wrong: `let xor = 0;
for (let i = 0; i < nums.length; i++) xor ^= i ^ nums[i]; // only 0..n-1`,
      right: `let xor = nums.length; // XOR with n (the missing range includes n)
for (let i = 0; i < nums.length; i++) xor ^= i ^ nums[i];`,
      explanation: 'The range is [0..n]. XOR indices 0..n-1 with elements cancels matching pairs. Must also XOR with n to cover the full range.',
    },
    {
      title: 'Left shift overflow for values beyond 31 bits',
      wrong: `1 << 32; // JavaScript: 1 << 32 === 1 (wraps around — shift is mod 32)`,
      right: `// For large bit positions, use BigInt or separate your logic
// Bitwise ops in JS operate on 32-bit signed integers`,
      explanation: 'JavaScript bitwise operators convert numbers to 32-bit signed integers. Shifts >= 32 wrap around. Use BigInt for wider bit manipulation.',
    },
  ];

  challenge: Challenge = {
    title: 'Number of 1 Bits (Population Count)',
    language: 'typescript',
    description: 'Write a function that takes a positive integer and returns the number of 1-bits it has (also known as the Hamming weight). Then count set bits for all numbers 0..n.',
    hints: ['n & (n-1) removes the lowest set bit', 'For 0..n range: use DP — countBits[i] = countBits[i>>1] + (i&1)', 'Each step eliminates one set bit until n becomes 0'],
    starterCode: `function hammingWeight(n: number): number {
  // Count set bits efficiently
}

function countBits(n: number): number[] {
  // Return array where result[i] = number of 1s in binary of i, for i in 0..n
}`,
    solution: `function hammingWeight(n: number): number {
  let count = 0;
  while (n) { n &= n - 1; count++; }
  return count;
}

function countBits(n: number): number[] {
  const dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++)
    dp[i] = dp[i >> 1] + (i & 1); // i>>1 is i with last bit dropped; +1 if i is odd
  return dp;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does n & (n-1) do?',
      options: ['Sets the lowest bit', 'Clears the lowest set bit', 'Checks if n is even', 'Reverses the bits'],
      answer: 1,
      explanation: 'n-1 flips all bits from the lowest set bit downward. ANDing with n clears just that lowest set bit, leaving everything else unchanged.',
    },
    {
      q: 'What is 5 ^ 5 in binary?',
      options: ['5', '10', '0', '1'],
      answer: 2,
      explanation: 'XOR of any number with itself is 0. 5 ^ 5 = 0101 ^ 0101 = 0000 = 0. This is the self-canceling property of XOR.',
    },
    {
      q: 'How do you check if bit k is set in number n?',
      options: ['n & k', '(n >> k) & 1', 'n | (1 << k)', 'n ^ (1 << k)'],
      answer: 1,
      explanation: 'Right shift n by k positions brings bit k to position 0. ANDing with 1 isolates that bit — result is 0 or 1.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does n & -n isolate the lowest set bit?',
      a: 'In two\'s complement, -n is ~n + 1. This flips all bits and adds 1, which propagates the carry through all the trailing 0 bits and the lowest set bit, resulting in all zeros below the lowest set bit and the lowest set bit remaining. ANDing with n keeps only that bit.',
    },
    {
      q: 'When is bit manipulation preferred over arithmetic in interviews?',
      a: 'When the problem is explicitly about bits (set bits, XOR uniqueness, power of 2). Also for space-efficient subset enumeration (bitmask DP). For general arithmetic, stick to readable code — bit tricks can make code harder to follow and are only justified when they provide a significant advantage.',
    },
    {
      q: 'What is the difference between >> and >>> in JavaScript?',
      a: '>>(signed right shift) fills with the sign bit — negative numbers stay negative. >>>(unsigned right shift) fills with 0 — always positive result. Use >>> 0 to convert a 32-bit signed integer to unsigned, which is needed after reverseBits or other operations that may produce a negative JS number from a positive 32-bit pattern.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Bit manipulation: XOR cancels duplicates (a^a=0), n&(n-1) clears lowest bit, 1<<k creates bitmasks — O(1) tricks for counting, isolation, and set enumeration.',
    mustKnow: [
      'n & 1 = parity; n & (n-1) = clear lowest bit; n & -n = isolate lowest bit',
      'Power of 2: n > 0 && (n & (n-1)) === 0',
      'XOR: a^a=0, a^0=a, self-inverse — find single unique number',
      'Count set bits: n &= n-1 each iteration, O(set bits)',
      'Bitmask subsets: 0 to (1<<n)-1 enumerates all 2^n subsets',
    ],
    interviewFocus: [
      'Single number I, II, III (XOR)',
      'Number of 1 bits / counting bits 0..n',
      'Missing number (XOR with expected range)',
    ],
  };
}
