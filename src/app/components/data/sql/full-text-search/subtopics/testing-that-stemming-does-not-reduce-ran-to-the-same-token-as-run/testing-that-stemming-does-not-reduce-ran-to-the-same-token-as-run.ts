import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-stemming-ran-run-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-stemming-does-not-reduce-ran-to-the-same-token-as-run.html',
  styleUrl: './testing-that-stemming-does-not-reduce-ran-to-the-same-token-as-run.scss',
})
export class TestingThatStemmingDoesNotReduceRanToTheSameTokenAsRunSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory\'s Example',
      points: [
        'The "LIKE vs full-text search" theory section lists stemming as a full-text feature with the example: "stemming (run/runs/ran → same token)" — presenting all three word forms as reducing to one shared token.',
        'This conflates two different kinds of text normalization: STEMMING (algorithmic suffix-stripping, e.g. the Porter/Snowball stemmer PostgreSQL\'s \'english\' dictionary and MSSQL\'s linguistic analysis both use) versus LEMMATIZATION (dictionary-based normalization to a word\'s canonical dictionary form, aware of irregular forms). "run" and "runs" share an obvious suffix pattern; "ran" does not — it is an irregular past-tense form with no shared suffix to strip.',
      ],
    },
    {
      heading: 'Why "ran" Specifically Breaks the Claim',
      points: [
        'A suffix-stripping stemmer works by recognizing patterns like -s, -ed, -ing and removing them (runs → run, running → run). "ran" contains no such removable suffix — it is a completely different surface form of the same underlying verb, and only a dictionary/lemmatization step (which standard SQL full-text stemmers do not perform) could map it to "run."',
        'This is a genuine, well-known limitation of algorithmic stemmers used by both PostgreSQL and SQL Server\'s built-in full-text search — irregular verbs (run/ran, go/went, is/was, etc.) are NOT normalized to a shared token, meaning a search for "ran" will not match documents containing only "run" or "runs," and vice versa.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the theory\'s exact claim in PostgreSQL',
      language: 'sql',
      code: `SELECT to_tsvector('english', 'run runs ran');
-- 'ran':3 'run':1,2
--
-- Only 'run' and 'runs' collapse to the SAME lexeme ('run', at
-- positions 1 and 2). 'ran' remains its own, separate lexeme at
-- position 3 -- directly contradicting the theory's claim that all
-- three "→ same token."

-- Confirming with a match test:
SELECT to_tsvector('english', 'The dog ran fast') @@ to_tsquery('english', 'run');
-- false -- a document containing only "ran" (no "run" or "runs")
-- does NOT match a search for "run".

SELECT to_tsvector('english', 'The dog runs fast') @@ to_tsquery('english', 'run');
-- true -- "runs" DOES correctly stem to the same token as "run".`,
    },
    {
      label: 'Confirming the same limitation in MSSQL',
      language: 'sql',
      code: `-- Insert three test rows into a full-text-indexed table
INSERT INTO dbo.articles (title, body) VALUES
  ('Test Run',  'I run every morning.'),
  ('Test Runs', 'She runs every morning.'),
  ('Test Ran',  'He ran every morning.');
-- (assumes the full-text index from the main page's setup tab)

SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, 'run');
-- Returns 'Test Run' and 'Test Runs' (inflectional forms of "run"
-- via CONTAINS' own linguistic analysis) -- but NOT 'Test Ran',
-- confirming the same irregular-verb gap exists in MSSQL's full-text
-- engine as well.

SELECT id, title FROM dbo.articles
WHERE FREETEXT(body, 'run');
-- FREETEXT applies broader inflectional matching than CONTAINS,
-- but still will not reliably surface 'Test Ran' the way it does
-- for 'Test Runs' -- irregular forms remain the harder case for
-- both CONTAINS and FREETEXT.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A user searches an article archive for "ran" and gets zero results, even though an article titled "How I Run Marathons" clearly discusses running. Support assumes this is a bug, since the docs say stemming handles "run/runs/ran" as one token. Is it a bug?',
    hint: 'Check whether "ran" and "run" share a common suffix that a suffix-stripping stemmer could remove, the way "runs" and "running" do.',
    solution: `Not a bug — this is the expected, documented behavior of
suffix-based stemming, and the "run/runs/ran → same token" claim in
the theory section is the part that's actually incorrect. "run" and
"runs" share the -s suffix, which the stemmer strips to produce a
common token. "ran" is an irregular past-tense form with no shared
suffix to strip, so it remains a distinct token from "run" in both
PostgreSQL's and MSSQL's full-text engines.

If a search experience needs to handle irregular verb forms like
this, stemming alone is not sufficient — that requires a
dictionary-based lemmatizer or a custom thesaurus file (MSSQL
supports a custom thesaurus XML file; PostgreSQL supports a
custom ispell/hunspell dictionary configuration) that explicitly
maps irregular forms to their base form, which is a separate,
additional setup step beyond the default stemming this page
describes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'stemming in full-text search understands verb conjugation the way a human reader does, normalizing any related word form (including irregular ones) to a shared root.',
      reality: 'algorithmic stemming (Porter/Snowball, used by both PostgreSQL and MSSQL) works by stripping common suffix patterns — it has no dictionary of irregular forms, so words like "ran," "went," or "was" are not reduced to "run," "go," or "is."',
    },
    {
      thought: 'if a documentation example lists three word forms as stemming to the same token, all three genuinely do in practice.',
      reality: 'testing the exact claim with to_tsvector shows only the regular forms ("run"/"runs") collapse together — the irregular form ("ran") does not, a gap worth verifying with a real query rather than trusting the example at face value.',
    },
    {
      thought: 'a missing search result for a common, correctly-spelled word is always a configuration bug in the full-text index.',
      reality: 'it can also be an inherent limitation of suffix-based stemming for irregular word forms — distinguishing the two determines whether the fix is a thesaurus/dictionary configuration change or an actual index/setup bug.',
    },
  ];
}
