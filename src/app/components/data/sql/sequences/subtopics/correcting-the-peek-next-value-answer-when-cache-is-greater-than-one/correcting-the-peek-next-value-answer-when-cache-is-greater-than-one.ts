import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-correcting-peek-next-value-cache-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-peek-next-value-answer-when-cache-is-greater-than-one.html',
  styleUrl: './correcting-the-peek-next-value-answer-when-cache-is-greater-than-one.scss',
})
export class CorrectingThePeekNextValueAnswerWhenCacheIsGreaterThanOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An Answer That Only Works When CACHE Is 1',
      points: [
        'The main page\'s quiz asks "How do you peek at the next sequence value without consuming it in PostgreSQL?" and gives this as the correct answer: "Querying the sequence relation directly (SELECT last_value, increment_by FROM my_sequence) shows the current state without advancing it." This is presented as a reliable technique — but it silently assumes CACHE 1, and the page\'s OWN "Standalone SEQUENCE" code tab creates seq_invoice_no with CACHE 50.',
        'With CACHE > 1, the very first nextval() call in a session doesn\'t just allocate ONE value — it reserves an entire block of CACHE values at once, advancing the sequence\'s persisted last_value to the END of that block immediately. SELECT last_value + increment_by FROM seq_name then reports a value far AHEAD of what the next actual nextval() call (from that same session, still working through its already-reserved block) will return.',
      ],
    },
    {
      heading: 'What "last_value" Actually Tracks With Caching',
      points: [
        'last_value in the sequence\'s catalog reflects the highest value ALLOCATED to any session\'s local cache so far — not the highest value actually CONSUMED by a nextval() call. When CACHE 50 is in effect, one nextval() call can jump last_value forward by 50, even though only 1 of those 50 values has been handed out via nextval() at that point; the remaining 49 sit in that session\'s private cache, invisible to last_value queries from other sessions.',
        'The quiz\'s answer, therefore, does not "peek at the next value nextval() will return" for a cached sequence — it reports the boundary of the last-reserved block, which can be dozens of values ahead of the true next nextval() result within an already-active cache.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setting up the exact sequence the main page uses',
      language: 'sql',
      code: `CREATE SEQUENCE seq_invoice_no
    START WITH 100000
    INCREMENT BY 1
    NO CYCLE
    CACHE 50;   -- exactly as shown on the main page's own code tab

-- Before any nextval() call:
SELECT last_value, increment_by FROM seq_invoice_no;
--  last_value | increment_by
-- ------------+---------------
--      100000 |       1
-- (a freshly created sequence hasn't been "used" yet -- is_called
-- is false, so last_value here reflects the START value itself)`,
    },
    {
      label: 'The mismatch between the "peek" answer and the real next value',
      language: 'sql',
      code: `-- First nextval() call in this session:
SELECT nextval('seq_invoice_no');
-- Returns 100000 -- this ALSO reserves the entire 50-value block
-- (100000 through 100049) for this session's local cache in one step.

-- Now try the quiz's recommended "peek" technique:
SELECT last_value, increment_by FROM seq_invoice_no;
--  last_value | increment_by
-- ------------+---------------
--      100049 |       1
-- The quiz's formula (last_value + increment_by) suggests the next
-- value is 100050 -- but that's wrong for THIS session:

SELECT nextval('seq_invoice_no');
-- Returns 100001 -- not 100050. The next 48 calls in this SAME
-- session will return 100002, 100003, ... 100049, all served from
-- the already-reserved local cache, with last_value never changing
-- again until the cache is exhausted.`,
    },
    {
      label: 'A more honest way to reason about "peek" with CACHE > 1',
      language: 'sql',
      code: `-- last_value + increment_by is only a reliable "next value" preview
-- for a sequence created with CACHE 1 (or the default of 1 in some
-- configurations), where every nextval() call individually advances
-- last_value by exactly one step:
CREATE SEQUENCE seq_gapless_no START WITH 1 CACHE 1;

SELECT last_value, increment_by FROM seq_gapless_no;  -- 1, 1 (unused)
SELECT nextval('seq_gapless_no');                      -- 1
SELECT last_value, increment_by FROM seq_gapless_no;  -- 1, 1
-- Here, last_value + increment_by correctly predicts 2 as the next
-- value -- because CACHE 1 means every nextval() call maps 1:1 to a
-- last_value change, with no hidden pre-reserved block.
--
-- For any sequence created with CACHE > 1 (like the main page's own
-- CACHE 50 example), there is no reliable way to "peek" at the exact
-- next value a specific session's nextval() will return without
-- either calling nextval() itself or knowing that session's private
-- cache state, which isn't exposed anywhere.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wants to display "your invoice number will be #100050" to a user BEFORE actually inserting the invoice row, using SELECT last_value + increment_by FROM seq_invoice_no (the main page\'s quiz-endorsed technique), against the exact seq_invoice_no (CACHE 50) shown on the page. Based on the test above, will this number be accurate?',
    hint: 'The mismatch only shows up AFTER the first nextval() call reserves a cache block — check the state before vs. after that first call.',
    solution: `It depends entirely on whether nextval() has already been called in
some session against this sequence, and how much of the current
cache block remains unconsumed -- in general, no, it will NOT be
reliably accurate for a CACHE 50 sequence. As demonstrated above,
right after the very first nextval() call, last_value jumps to
100049 (the end of the reserved block), making last_value +
increment_by report 100050 -- while the actual next nextval() call in
that same session returns 100001, off by up to 49.

There is no safe way to preview the exact next value for a session
using a CACHE > 1 sequence without actually calling nextval() (which
consumes it) or tracking that session's own local cache state
separately in application code. If the developer genuinely needs an
accurate "your number will be #N" preview before insert, the reliable
options are: (1) actually call nextval() early and hold the returned
value, accepting it as final, or (2) switch to CACHE 1 for that
specific sequence, accepting the throughput cost, so last_value +
increment_by becomes an accurate predictor again.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SELECT last_value, increment_by FROM seq_name reliably shows what the very next nextval() call on that sequence will return, regardless of the sequence\'s CACHE setting.',
      reality: 'this only holds for CACHE 1 — for any sequence with CACHE > 1 (like the main page\'s own CACHE 50 example), last_value reflects the end of the last RESERVED block, which can be far ahead of what the next nextval() call in an active session will actually return.',
    },
    {
      thought: 'last_value in a sequence\'s catalog row tracks the last value actually consumed by a nextval() call.',
      reality: 'last_value tracks the last value ALLOCATED to any session\'s cache — with CACHE > 1, a single nextval() call can advance last_value by the entire cache size, even though only one value from that block has actually been handed out so far.',
    },
    {
      thought: 'the "peek at the next value" technique is a general-purpose, dialect-correct answer applicable to any PostgreSQL sequence.',
      reality: 'it is only accurate for sequences with CACHE 1 — the technique gives a systematically wrong (too-high) preview for any sequence configured with a larger cache, which is common for high-throughput ID generation.',
    },
  ];
}
