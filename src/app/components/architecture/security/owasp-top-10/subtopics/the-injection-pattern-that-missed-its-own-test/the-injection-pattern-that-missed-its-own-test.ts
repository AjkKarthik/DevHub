import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Test Case That Contradicted Its Own Comment',
    points: [
      'The main page\'s own Challenge solution defines <code>INJECTION_PATTERNS</code> including the string <code>"\'or"</code> — a single quote immediately followed by "or", no space between them. Its own demonstration call directly below it is <code>analyseRequest("SELECT * FROM users WHERE id = \'1\' OR \'1\'=\'1\'", \'u1\', \'u1\')</code>, commented <code>// INJECTION</code>.',
      'Running the actual function against that exact string returns <code>\'SAFE\'</code>, not <code>\'INJECTION\'</code> — a purely self-contained catch, found simply by tracing the pattern match against the literal test string character by character, no external research needed.',
    ],
  },
  {
    heading: 'Why the Space Broke the Match',
    points: [
      'The classic SQL injection example — <code>\'1\' OR \'1\'=\'1\'</code> — has a SPACE between the closing quote of <code>\'1\'</code> and the word <code>OR</code>. The pattern <code>"\'or"</code> only matches a quote DIRECTLY adjacent to "or," which never occurs anywhere in that string.',
      'The fix: match <code>" or "</code> (with a leading and trailing space) instead — this matches the SPACE-SEPARATED "OR" that appears in the classic example, while still correctly leaving alone ordinary words that happen to contain the letters "or" (like "for" or "order"), since those don\'t have a standalone, space-bounded "or" token.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Pattern Never Matches',
    language: 'typescript',
    code: `function analyseRequest(query: string, userId: string, resourceOwnerId: string): string {
  const INJECTION_PATTERNS = ['--', ';', "'or", 'union', 'drop', 'delete', 'insert'];
  const lowerQuery = query.toLowerCase();

  if (INJECTION_PATTERNS.some(p => lowerQuery.includes(p))) {
    return 'INJECTION';
  }
  if (userId !== resourceOwnerId) return 'IDOR';
  return 'SAFE';
}

// The classic example has a SPACE before "OR" -- "'or" (no space)
// never matches it.
console.log(analyseRequest("SELECT * FROM users WHERE id = '1' OR '1'='1'", 'u1', 'u1'));
// Actual result: 'SAFE'  -- contradicts the main page's own '// INJECTION' comment`,
  },
  {
    label: 'After — Pattern Matches the Classic Case',
    language: 'typescript',
    code: `function analyseRequest(query: string, userId: string, resourceOwnerId: string): string {
  const INJECTION_PATTERNS = ['--', ';', ' or ', 'union', 'drop', 'delete', 'insert'];
  const lowerQuery = query.toLowerCase();

  if (INJECTION_PATTERNS.some(p => lowerQuery.includes(p))) {
    return 'INJECTION';
  }
  if (userId !== resourceOwnerId) return 'IDOR';
  return 'SAFE';
}

console.log(analyseRequest("SELECT * FROM users WHERE id = '1' OR '1'='1'", 'u1', 'u1'));
// Now correctly returns 'INJECTION'

console.log(analyseRequest('SELECT name FROM users WHERE id = 42', 'u1', 'u2'));  // 'IDOR' -- unaffected
console.log(analyseRequest('SELECT name FROM users WHERE id = 42', 'u1', 'u1'));  // 'SAFE' -- unaffected`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new test case is added: <code>analyseRequest(\'SELECT * FROM orders\', \'u1\', \'u1\')</code>. Using the FIXED <code>\' or \'</code> pattern, does this return <code>\'INJECTION\'</code> or <code>\'SAFE\'</code>? What about a query selecting from a table literally named <code>orders</code> versus one that happened to be named, say, <code>major_orders</code>?',
  hint: 'Check whether the string <code>orders</code> (or <code>major_orders</code>) contains the exact 4-character sequence <code>" or "</code> — space, o, r, space.',
  solution: `// 'SELECT * FROM orders' -- lowercased is 'select * from orders'.
// Does it contain the substring " or " (space-o-r-space)? The word
// "orders" contains "or" but NOT surrounded by spaces on both sides
// within "orders" itself -- there's no space between "or" and "ders".
// Result: 'SAFE' (assuming userId === resourceOwnerId here).

// 'SELECT * FROM major_orders' -- same reasoning: "orders" is still
// one contiguous word with no internal space around "or". Also 'SAFE'.

// The fix's own boundary condition matters here: " or " only matches
// when "or" is genuinely its own space-separated token, which is
// exactly the shape the classic SQL injection payloads use (a
// standalone OR keyword), not a coincidental substring inside a
// longer identifier like "orders".`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This bug would have been caught immediately by anyone running the Challenge\'s own example calls, since they\'re printed right there with expected comments.',
    reality: 'The comments (<code>// INJECTION</code>, <code>// IDOR</code>, <code>// SAFE</code>) describe what the AUTHOR intended, not what the code was verified to produce — reading the code and comments together looks perfectly consistent unless someone actually EXECUTES the function against the given input and checks the real return value, which is exactly what this subtopic did to catch it.',
  },
  {
    thought: 'The fixed <code>\' or \'</code> pattern is now a production-grade SQL injection detector.',
    reality: 'It remains a deliberately simplified, illustrative pattern match — a real attacker can trivially avoid a bare space-bounded "or" (using tab characters, newlines, SQL comments to break up tokens, or entirely different injection techniques like UNION-based or blind boolean injection that don\'t use the word "OR" at all). The main page\'s own theory is explicit that the REAL fix for SQL injection is parameterised queries, never string pattern-matching — this Challenge is a toy exercise in recognizing ONE example shape, not a substitute for that.',
  },
];

@Component({
  selector: 'app-sec-owasp-injection-pattern',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-injection-pattern-that-missed-its-own-test.html',
  styleUrl: './the-injection-pattern-that-missed-its-own-test.scss',
})
export class TheInjectionPatternThatMissedItsOwnTestSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
