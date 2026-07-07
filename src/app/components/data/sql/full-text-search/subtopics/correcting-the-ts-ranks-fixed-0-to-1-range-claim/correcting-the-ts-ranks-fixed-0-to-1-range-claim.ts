import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ts-rank-range-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-ts-ranks-fixed-0-to-1-range-claim.html',
  styleUrl: './correcting-the-ts-ranks-fixed-0-to-1-range-claim.scss',
})
export class CorrectingTheTsRanksFixed0To1RangeClaimSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Quiz\'s Claim',
      points: [
        'The "What does ts_rank() return and how is it used?" quiz answer states ts_rank returns "a floating-point relevance score between 0.0 and 1.0 based on term frequency in the tsvector" — presenting [0.0, 1.0] as a guaranteed, fixed range.',
        'Contrast this with the theory section\'s claim about MSSQL: "CONTAINSTABLE returns RANK (0–1000)." MSSQL\'s RANK genuinely IS documented and bounded to that range — but PostgreSQL\'s ts_rank does not carry the same kind of guarantee.',
      ],
    },
    {
      heading: 'What PostgreSQL\'s Own Documentation Says',
      points: [
        'PostgreSQL\'s official documentation on text search ranking is explicit that ts_rank and ts_rank_cd values have no fixed upper (or lower) bound — the scores are weighted sums over matching lexemes (further adjusted by optional length-normalization flags), and a document with many repeated or high-weight matches can produce a rank well above 1.0.',
        'The scores are intended for RELATIVE ranking within a single result set — comparing rows against each other for the same query — not as an absolute, cross-query-comparable percentage. Treating 1.0 as a firm ceiling (e.g., for a progress bar, a percentage display, or a hard-coded relevance cutoff) is exactly the kind of thing the quiz\'s wording invites but PostgreSQL does not guarantee.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Producing a ts_rank score above 1.0',
      language: 'sql',
      code: `-- A document that repeats the search term many times in a short body
SELECT ts_rank(
    to_tsvector('english',
      'index index index index index index index index index index'),
    to_tsquery('english', 'index')
) AS rank;
-- rank ≈ 1.9 or higher, depending on PostgreSQL version's default
-- weight array -- clearly ABOVE the quiz's claimed 0.0-1.0 ceiling.

-- A more realistic example: an article whose title AND body both
-- match, using the challenge's own weighted setweight() pattern
SELECT ts_rank(
    setweight(to_tsvector('english', 'Index Optimizer Index Guide'), 'A') ||
    setweight(to_tsvector('english',
      'This guide covers the index optimizer, index seeks, and index scans in depth.'), 'B'),
    to_tsquery('english', 'index')
) AS rank;
-- Multiple weighted matches across both title (weight A) and body
-- (weight B) can also push the score past 1.0.`,
    },
    {
      label: 'PostgreSQL\'s own normalization flags acknowledge this',
      language: 'sql',
      code: `-- ts_rank(weights, vector, query, normalization) -- normalization
-- is a bitmask of OPTIONAL adjustments, e.g.:
--   1  -- divide by 1 + log(document length)
--   2  -- divide by document length
--   4  -- divide by mean harmonic distance between extents
--   8  -- divide by number of unique words in document
--  16  -- divide by 1 + log(number of unique words)
--  32  -- divide by itself + 1 (this is the ONLY flag that forces
--        the result into 0..1, by construction: x / (x + 1) < 1 always)

SELECT ts_rank(to_tsvector('english',
      'index index index index index index index index index index'),
    to_tsquery('english', 'index'), 32) AS rank_normalized_0_to_1;
-- Only WITH normalization flag 32 explicitly applied does the
-- result get mathematically forced under 1.0 -- confirming that
-- the DEFAULT, unnormalized ts_rank (no fourth argument, as used
-- everywhere on the main page) has no such guarantee.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You build a UI relevance meter that displays ts_rank scores as a percentage (rank * 100%), assuming the quiz\'s "0.0 to 1.0" range holds. During testing, one article displays as "187% relevant." Is this a bug in your query, or expected PostgreSQL behavior?',
    hint: 'Check whether you are using the fourth (normalization) argument to ts_rank, and what PostgreSQL\'s documentation says about the range of the default, unnormalized score.',
    solution: `This is expected PostgreSQL behavior, not a bug in the query. The
default (unnormalized) ts_rank has no fixed upper bound -- for a
document with many matches of the search term, especially across
higher-weighted sections (title, weight A), the raw score can
comfortably exceed 1.0, exactly as demonstrated above.

To get a score that is mathematically guaranteed to stay within
0..1 for a percentage-style UI, pass normalization flag 32 as the
fourth argument to ts_rank (or ts_rank_cd): it divides the raw
score by itself-plus-one, which is bounded for any non-negative
input. Without that explicit flag, the "0.0 to 1.0" claim does not
hold — it is a common assumption, but not one PostgreSQL's default
ts_rank behavior actually guarantees.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ts_rank() always returns a value between 0.0 and 1.0, similar to how MSSQL\'s CONTAINSTABLE RANK is documented to stay within 0-1000.',
      reality: 'unlike MSSQL\'s RANK, PostgreSQL\'s default (unnormalized) ts_rank has no fixed upper bound — scores can exceed 1.0 for documents with many or high-weight term matches, unless an explicit normalization flag is passed.',
    },
    {
      thought: 'ts_rank scores are safe to display as an absolute percentage or compare across completely different search queries.',
      reality: 'the scores are intended for RELATIVE ranking within a single query\'s result set — comparing rows against each other for the same tsquery — not as a cross-query-comparable absolute measure, with or without normalization.',
    },
    {
      thought: 'if a value "usually" stays in a certain range during casual testing, it is safe to treat that range as a hard guarantee in application code.',
      reality: 'the quiz\'s claim likely reflects TYPICAL scores for realistic documents — but "usually small" is a very different guarantee than "always between 0.0 and 1.0," and code that assumes the latter can break on documents with unusually dense term matches.',
    },
  ];
}
