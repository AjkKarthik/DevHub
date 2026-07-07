import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dead-left-ssn-zero-masking-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-left-ssn-0-in-the-masking-example-is-dead-code.html',
  styleUrl: './demonstrating-that-left-ssn-0-in-the-masking-example-is-dead-code.scss',
})
export class DemonstratingThatLeftSsn0InTheMaskingExampleIsDeadCodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Function Call That Never Changes the Result',
      points: [
        'The main page\'s Q&A on data masking gives this exact expression: SELECT id, LEFT(ssn, 0) + \'***-**-\' + RIGHT(ssn, 4) AS ssn FROM customers. Read carefully: LEFT(ssn, 0) asks for the first ZERO characters of ssn — which is, by definition, always an empty string, for every possible value of ssn, including NULL-adjacent edge cases.',
        'Since an empty string concatenated with anything doesn\'t change the result, LEFT(ssn, 0) + \'***-**-\' + RIGHT(ssn, 4) is functionally IDENTICAL to simply \'***-**-\' + RIGHT(ssn, 4) — the LEFT(ssn, 0) call can be deleted entirely with zero change in output, for any input. This subtopic proves it directly rather than asking the reader to take the algebra on faith.',
      ],
    },
    {
      heading: 'What Was Probably Intended',
      points: [
        'The most likely explanation is that LEFT(ssn, 0) is a leftover or placeholder from an earlier draft of a masking pattern that was meant to show a FEW leading digits (e.g. LEFT(ssn, 3) for the area-number portion of a US SSN) before someone decided to hide the leading digits entirely and changed the count to 0 without removing the now-pointless function call.',
        'This isn\'t a functional bug — the output is correct either way, since RIGHT(ssn, 4) alone already fully masks everything except the last four digits, matching the intended "***-**-1234" masking pattern. It\'s a code-clarity issue: a reader encountering LEFT(ssn, 0) reasonably assumes it does SOMETHING, and has to work out that it\'s a no-op before understanding the masking logic actually only depends on RIGHT(ssn, 4).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming LEFT(col, 0) is always an empty string',
      language: 'sql',
      code: `SELECT
    LEFT('123456789', 0)  AS left_zero_1,
    LEFT('', 0)            AS left_zero_2,
    LEFT('ABC', 0)         AS left_zero_3;

-- left_zero_1 | left_zero_2 | left_zero_3
-- ------------+-------------+-------------
--             |             |
--
-- All three return an empty string ('') -- LEFT(x, 0) is defined to
-- return zero characters regardless of what x is. There is no input
-- for which LEFT(x, 0) returns anything other than ''.`,
    },
    {
      label: 'Proving the masking expression is unaffected by removing it',
      language: 'sql',
      code: `CREATE TABLE customers (id INT, ssn VARCHAR(11));
INSERT INTO customers VALUES (1, '123-45-6789'), (2, '987-65-4321');

-- The main page's own masking expression, exactly as written:
SELECT
    id,
    LEFT(ssn, 0) + '***-**-' + RIGHT(ssn, 4) AS ssn_masked_original
FROM customers;

-- The same expression with LEFT(ssn, 0) removed entirely:
SELECT
    id,
    '***-**-' + RIGHT(ssn, 4) AS ssn_masked_simplified
FROM customers;

--  id | ssn_masked_original | ssn_masked_simplified
-- ----+----------------------+------------------------
--   1 | ***-**-6789          | ***-**-6789
--   2 | ***-**-4321          | ***-**-4321
--
-- Byte-for-byte identical output on every row. LEFT(ssn, 0) is
-- confirmed dead code -- it can be deleted with zero behavior change.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reading the main page\'s masking example asks "what is LEFT(ssn, 0) actually protecting against — is it stripping some kind of prefix from malformed SSN values before masking?" Based on the test above, how would you answer, and what would you suggest changing in the code?',
    hint: 'What does LEFT(anything, 0) return, regardless of what "anything" contains — including a malformed value?',
    solution: `LEFT(ssn, 0) isn't protecting against anything, and it doesn't
strip a prefix conditionally -- LEFT(x, 0) returns an empty string
for EVERY possible input x, malformed or not, with no exceptions.
It's not doing defensive data-cleaning; it's a no-op that happens to
always evaluate to ''.

The suggested change is to simply delete LEFT(ssn, 0) + from the
expression, leaving '***-**-' + RIGHT(ssn, 4) AS ssn -- this produces
byte-for-byte identical output for every row, as demonstrated above,
while being immediately readable without requiring a reader to work
out that the LEFT() call is inert. If the original intent was ever to
show a few leading digits of the SSN (a common but less secure
masking pattern), that would require changing the 0 to some positive
number like 3, not simply removing the call — but as published, the
0 makes the term contribute nothing at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'LEFT(ssn, 0) in the masking expression is stripping or sanitizing some part of the SSN value before the mask is applied.',
      reality: 'LEFT(x, 0) always returns an empty string for any input, with no conditional or sanitizing behavior — it contributes nothing to the final result and can be removed with zero change in output.',
    },
    {
      thought: 'if a code example includes a function call, that call must be doing something meaningful, since it wouldn\'t otherwise have been included.',
      reality: 'code examples can contain leftover artifacts from earlier drafts (like a masking pattern that used to show leading digits) that become functionally inert after later edits — LEFT(ssn, 0) is exactly this kind of dead code.',
    },
    {
      thought: 'proving a piece of SQL is "dead code" requires reading the database engine\'s source or documentation in detail.',
      reality: 'for a case this direct, it can be proven empirically — running the expression with and without the suspect term and confirming byte-for-byte identical output across representative inputs, as shown above.',
    },
  ];
}
