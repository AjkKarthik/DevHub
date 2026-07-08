import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-search-vector-stale-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-search-vector-goes-stale-for-new-rows.html',
  styleUrl: './testing-that-the-challenges-search-vector-goes-stale-for-new-rows.scss',
})
export class TestingThatTheChallengesSearchVectorGoesStaleForNewRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the Challenge\'s Solution Builds',
      points: [
        'The challenge\'s PostgreSQL solution: ALTER TABLE articles ADD COLUMN search_vector tsvector; then a single UPDATE articles SET search_vector = setweight(...) || setweight(...); populates the column ONCE, followed by CREATE INDEX ... USING GIN (search_vector).',
        'This is a plain tsvector column — not GENERATED ALWAYS AS ... STORED, and no trigger is created anywhere in the challenge\'s starter code or solution to keep it in sync going forward.',
      ],
    },
    {
      heading: 'The Page\'s Own Q&A Already Explains Why This Is a Problem',
      points: [
        'The "How do I keep the PostgreSQL tsvector column up to date as rows change?" Q&A on the SAME page states plainly: PostgreSQL 12+ supports GENERATED ALWAYS AS ... STORED for tsvector columns — the database updates the column automatically. For older versions, use a trigger. Neither technique appears anywhere in the challenge\'s solution.',
        'Without either mechanism, search_vector reflects only the data present at the moment the one-time UPDATE ran. Any row inserted afterward has search_vector = NULL (never matched by any @@ query); any row whose title or body is later edited keeps its OLD search_vector, silently returning stale search results.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the challenge\'s exact solution, then testing staleness',
      language: 'sql',
      code: `-- The challenge's exact solution
ALTER TABLE articles ADD COLUMN search_vector tsvector;

INSERT INTO articles (title, body, author) VALUES
  ('Query Optimizer Basics', 'How the index seek works', 'A. Author');

UPDATE articles SET search_vector =
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),  'B');

CREATE INDEX ix_articles_fts ON articles USING GIN (search_vector);

-- So far, search works for this one row:
SELECT id, title FROM articles
WHERE search_vector @@ to_tsquery('english', 'optimizer');
-- Returns the row above. Looks correct.

-- Now insert a NEW article, exactly as the challenge's schema allows:
INSERT INTO articles (title, body, author) VALUES
  ('Index Optimizer Deep Dive', 'Advanced optimizer internals', 'B. Author');

SELECT id, title, search_vector FROM articles
WHERE title = 'Index Optimizer Deep Dive';
-- search_vector is NULL -- nothing populated it on INSERT.

SELECT id, title FROM articles
WHERE search_vector @@ to_tsquery('english', 'optimizer');
-- Still returns only the FIRST row -- the new article is invisible
-- to full-text search entirely, despite containing "optimizer"
-- in both its title and body.`,
    },
    {
      label: 'The fix — GENERATED ALWAYS AS, matching the page\'s own Q&A',
      language: 'sql',
      code: `ALTER TABLE articles DROP COLUMN search_vector;

ALTER TABLE articles ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),  'B')
) STORED;

CREATE INDEX ix_articles_fts ON articles USING GIN (search_vector);

INSERT INTO articles (title, body, author) VALUES
  ('Index Optimizer Deep Dive', 'Advanced optimizer internals', 'B. Author');

SELECT id, title FROM articles
WHERE search_vector @@ to_tsquery('english', 'optimizer');
-- Now returns BOTH rows -- search_vector is computed automatically
-- on every INSERT and UPDATE, exactly as the page's own Q&A describes.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You follow the challenge\'s exact published PostgreSQL solution to build a searchable articles table, launch it, and everything works in your initial testing. Two weeks later, a colleague reports that articles published yesterday never show up in search results, even for exact title-word matches. What went wrong?',
    hint: 'Check how search_vector gets its value for a row inserted AFTER the initial CREATE INDEX/UPDATE sequence — is there a GENERATED clause or trigger anywhere in the challenge\'s solution?',
    solution: `The challenge's solution populates search_vector with a single,
one-time UPDATE statement and never sets up GENERATED ALWAYS AS ...
STORED or a trigger to keep it current. Every article inserted
AFTER that initial UPDATE has search_vector = NULL by default,
which never matches any @@ tsquery comparison -- so newly published
articles are permanently invisible to search, exactly matching the
colleague's report.

The fix is to rebuild the column as a generated column (PostgreSQL
12+) using the exact technique the page's own separate Q&A section
already documents: GENERATED ALWAYS AS (...) STORED, or a
BEFORE INSERT OR UPDATE trigger on older PostgreSQL versions. Either
approach keeps search_vector automatically synchronized with title
and body going forward, which the challenge's published solution
never implements despite the same page explaining exactly how to.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a challenge titled "Build a searchable articles table" that populates a tsvector column and adds a GIN index has fully solved full-text search for that table.',
      reality: 'a tsvector column populated by a one-time UPDATE only reflects the data that existed at that moment — without GENERATED ALWAYS AS or a trigger, every future INSERT and UPDATE leaves the search index silently out of sync.',
    },
    {
      thought: 'if a page\'s challenge and its Q&A section cover related material, the challenge\'s solution must already incorporate the Q&A\'s advice.',
      reality: 'here they were written independently — the Q&A correctly explains how to keep a tsvector column current, but the challenge\'s own published solution never applies that exact technique.',
    },
    {
      thought: 'testing a full-text search feature by searching for data that existed BEFORE the index was built is sufficient to confirm the whole pipeline works.',
      reality: 'that only proves the initial population step worked — the more important test is inserting NEW data afterward and confirming it becomes searchable without any manual re-population step.',
    },
  ];
}
