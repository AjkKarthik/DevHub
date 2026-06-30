import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-full-text-search',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './full-text-search.html',
  styleUrls: ['./full-text-search.scss']
})
export class SqlFullTextSearch {

  quickRef: QuickRefItem[] = [
    { name: 'CONTAINS (MSSQL)',         type: 'keyword', desc: 'Full-text predicate: word, phrase, prefix, proximity' },
    { name: 'FREETEXT (MSSQL)',         type: 'keyword', desc: 'Natural language search — inflectional forms, thesaurus' },
    { name: 'CONTAINSTABLE / FREETEXTTABLE', type: 'keyword', desc: 'Return ranked results with KEY and RANK columns' },
    { name: 'Full-text index (MSSQL)',  type: 'keyword', desc: 'Inverted index on CHAR/VARCHAR/NVARCHAR/VARBINARY columns' },
    { name: 'tsvector (PostgreSQL)',    type: 'keyword', desc: 'Processed text document — tokens with positions and weights' },
    { name: 'tsquery (PostgreSQL)',     type: 'keyword', desc: 'Full-text search query — tokens with boolean operators' },
    { name: 'to_tsvector / to_tsquery', type: 'function', desc: 'Convert text/query string to tsvector/tsquery with language stemming' },
    { name: 'ts_rank / ts_rank_cd',    type: 'function', desc: 'PG: score a tsvector match; cd weights proximity' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'LIKE vs full-text search',
      points: [
        'LIKE \'%word%\' requires a full table scan — no index can help with a leading wildcard.',
        'Full-text search builds an inverted index (word → list of document locations), enabling fast term lookups across millions of rows.',
        'Additional features: stemming (run/runs/ran → same token), stop words, thesaurus, proximity, ranking by relevance.',
        'Use full-text search for free-form text columns (descriptions, notes, articles); use LIKE for simple pattern matching on short structured fields.',
      ]
    },
    {
      heading: 'MSSQL full-text: setup',
      points: [
        'Requires the Full-Text Search feature installed. Check: SELECT FULLTEXTSERVICEPROPERTY(\'IsFullTextInstalled\').',
        'Steps: CREATE FULLTEXT CATALOG → CREATE FULLTEXT INDEX ON table(column) KEY INDEX pk_name ON catalog.',
        'Full-text indexes are populated asynchronously (change-tracking) or synchronously (CHANGE_TRACKING MANUAL).',
        'Supported column types: CHAR, VARCHAR, NVARCHAR, TEXT, NTEXT, XML, VARBINARY(MAX) with a type column.',
      ]
    },
    {
      heading: 'MSSQL: CONTAINS vs FREETEXT',
      points: [
        'CONTAINS: exact control — words, phrases ("exact phrase"), prefix (word*), proximity (NEAR), AND/OR/NOT.',
        'FREETEXT: natural language — automatically applies stemming, thesaurus, and inflectional forms. Less precise, more recall.',
        'CONTAINSTABLE / FREETEXTTABLE return a ranked result set joinable to the source table.',
      ]
    },
    {
      heading: 'PostgreSQL full-text: tsvector & tsquery',
      points: [
        'to_tsvector(\'english\', text) converts text to a tsvector: tokens stripped of stop words, stemmed by language.',
        'to_tsquery(\'english\', \'query\') parses the query with boolean operators: & (AND), | (OR), ! (NOT), <-> (phrase/adjacent).',
        'Match with the @@ operator: WHERE to_tsvector(\'english\', body) @@ to_tsquery(\'english\', \'search & engine\').',
        'Add a GIN index on a stored tsvector column for fast lookups at scale.',
      ]
    },
    {
      heading: 'Indexing and ranking',
      points: [
        'PostgreSQL: store a generated tsvector column and index it — avoids recomputing on every query.',
        'ts_rank(tsvector, tsquery) scores by term frequency; ts_rank_cd also weighs proximity.',
        'MSSQL: CONTAINSTABLE returns RANK (0–1000). Use it to ORDER BY relevance or filter by minimum rank.',
        'Both engines support language configurations (\'english\', \'french\', etc.) for correct stemming and stop words.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL full-text setup',
      language: 'sql',
      code: `-- Check full-text is installed
SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled');  -- must return 1

-- Create a full-text catalog
CREATE FULLTEXT CATALOG ft_catalog AS DEFAULT;

-- Create a full-text index on the articles table
CREATE FULLTEXT INDEX ON dbo.articles (
    title      LANGUAGE 1033,   -- English
    body       LANGUAGE 1033
)
KEY INDEX pk_articles           -- must be a unique, single-column index
ON ft_catalog
WITH CHANGE_TRACKING AUTO;      -- auto-sync with table changes

-- Check population status
SELECT FULLTEXTCATALOGPROPERTY('ft_catalog', 'PopulateStatus');
-- 0 = idle (done), 1 = full population in progress

-- Force a manual population
ALTER FULLTEXT INDEX ON dbo.articles START FULL POPULATION;`
    },
    {
      label: 'CONTAINS & FREETEXT (MSSQL)',
      language: 'sql',
      code: `-- Simple word search
SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, 'database');

-- Exact phrase
SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, '"query optimizer"');

-- Prefix search (words starting with 'optim')
SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, '"optim*"');

-- Proximity: 'index' within 5 words of 'seek'
SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, 'NEAR((index, seek), 5)');

-- Boolean: must contain 'index' but not 'scan'
SELECT id, title FROM dbo.articles
WHERE CONTAINS(body, 'index AND NOT scan');

-- Natural language search with ranking
SELECT
    a.id, a.title,
    ft.RANK
FROM dbo.articles a
JOIN FREETEXTTABLE(dbo.articles, body, 'query optimization techniques') AS ft
    ON a.id = ft.[KEY]
ORDER BY ft.RANK DESC;

-- FREETEXT (simpler, no ranking)
SELECT id, title FROM dbo.articles
WHERE FREETEXT(body, 'query optimization techniques');`
    },
    {
      label: 'PostgreSQL tsvector & tsquery',
      language: 'sql',
      code: `-- Simple full-text match
SELECT id, title
FROM articles
WHERE to_tsvector('english', body) @@ to_tsquery('english', 'database');

-- Phrase search (adjacent words)
SELECT id, title
FROM articles
WHERE to_tsvector('english', body) @@ phraseto_tsquery('english', 'query optimizer');

-- Boolean operators
SELECT id, title
FROM articles
WHERE to_tsvector('english', body)
   @@ to_tsquery('english', 'index & seek & !scan');

-- Ranking results
SELECT
    id, title,
    ts_rank(to_tsvector('english', body), to_tsquery('english', 'index')) AS rank
FROM articles
WHERE to_tsvector('english', body) @@ to_tsquery('english', 'index')
ORDER BY rank DESC
LIMIT 20;

-- Snippet highlighting
SELECT
    id,
    ts_headline('english', body,
        to_tsquery('english', 'index'),
        'MaxFragments=2, FragmentDelimiter= ... ') AS excerpt
FROM articles
WHERE to_tsvector('english', body) @@ to_tsquery('english', 'index');`
    },
    {
      label: 'GIN index on generated tsvector (PostgreSQL)',
      language: 'sql',
      code: `-- Add a stored tsvector column (updated by trigger or generated)
ALTER TABLE articles
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
) STORED;

-- Create GIN index on the stored column (fast lookup, no recompute per query)
CREATE INDEX ix_articles_fts ON articles USING GIN (search_vector);

-- Query using the indexed column (fast!)
SELECT id, title,
       ts_rank(search_vector, to_tsquery('english', 'index & seek')) AS rank
FROM articles
WHERE search_vector @@ to_tsquery('english', 'index & seek')
ORDER BY rank DESC
LIMIT 20;

-- websearch_to_tsquery: user-friendly input (Google-style)
SELECT id, title
FROM articles
WHERE search_vector @@ websearch_to_tsquery('english', 'query optimizer -scan');`
    },
  ];

  challenge: Challenge = {
    title: 'Build a searchable articles table',
    language: 'sql',
    description: 'Design a full-text search solution for an articles table with columns (id, title, body, author). (1) PostgreSQL: add a generated tsvector column combining title (weight A) and body (weight B), index it with GIN, and write a ranked search query. (2) MSSQL: set up a full-text index and write a CONTAINSTABLE query returning ranked results joined to the articles table.',
    hints: [
      'PostgreSQL: setweight(to_tsvector(\'english\', title), \'A\') || setweight(to_tsvector(\'english\', body), \'B\') — title matches rank higher.',
      'MSSQL: KEY INDEX must reference a single-column unique index (typically the primary key).',
      'Use ts_rank_cd for proximity-aware ranking in PostgreSQL.',
    ],
    starterCode: `-- PostgreSQL: weighted tsvector
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Populate manually
UPDATE articles SET search_vector =
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),  'B');

-- Create GIN index
CREATE INDEX ... ON articles USING GIN (...);

-- Ranked search query
SELECT id, title, ts_rank_cd(search_vector, q) AS rank
FROM articles, to_tsquery('english', '...') q
WHERE ...
ORDER BY rank DESC;

-- MSSQL: full-text setup
CREATE FULLTEXT CATALOG ...;
CREATE FULLTEXT INDEX ON articles (...) KEY INDEX ...;

-- Ranked query
SELECT a.id, a.title, ft.RANK
FROM articles a
JOIN CONTAINSTABLE(...) AS ft ON a.id = ft.[KEY]
ORDER BY ft.RANK DESC;`,
    solution: `-- PostgreSQL: weighted tsvector + GIN index
ALTER TABLE articles ADD COLUMN search_vector tsvector;

UPDATE articles SET search_vector =
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),  'B');

CREATE INDEX ix_articles_fts ON articles USING GIN (search_vector);

-- Ranked search
SELECT id, title,
       ts_rank_cd(search_vector, q) AS rank
FROM articles,
     to_tsquery('english', 'index & optimizer') q
WHERE search_vector @@ q
ORDER BY rank DESC
LIMIT 20;

-- MSSQL: full-text setup
CREATE FULLTEXT CATALOG ft_catalog AS DEFAULT;

CREATE FULLTEXT INDEX ON dbo.articles (title LANGUAGE 1033, body LANGUAGE 1033)
KEY INDEX pk_articles ON ft_catalog WITH CHANGE_TRACKING AUTO;

-- Ranked search with CONTAINSTABLE
SELECT a.id, a.title, ft.RANK
FROM dbo.articles a
JOIN CONTAINSTABLE(dbo.articles, (title, body), 'index AND optimizer') AS ft
    ON a.id = ft.[KEY]
ORDER BY ft.RANK DESC;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is LIKE \'%word%\' slow but full-text search fast?',
      options: [
        'LIKE uses a B-tree index; full-text uses a hash index',
        'LIKE with a leading wildcard cannot use any index and requires a full table scan; full-text uses an inverted index for fast token lookups',
        'LIKE is case-sensitive; full-text is case-insensitive',
        'LIKE reads raw bytes; full-text reads compressed data'
      ],
      answer: 1,
      explanation: 'An inverted index maps each word to the list of document IDs containing it. A full-text query looks up the word(s) in the index — O(log n) — then retrieves matching rows. LIKE \'%word%\' must scan every row byte by byte because no B-tree can skip the leading wildcard.'
    },
    {
      q: 'What does the @@ operator do in PostgreSQL full-text search?',
      options: [
        'Concatenates two tsvectors',
        'Tests whether a tsvector matches a tsquery — returns true/false for filtering',
        'Ranks a tsvector against a tsquery',
        'Converts a string to tsvector format'
      ],
      answer: 1,
      explanation: '@@ is the full-text match operator: tsvector @@ tsquery returns TRUE if the document (tsvector) satisfies the query (tsquery). It can use a GIN index when the left side is an indexed tsvector column.'
    },
    {
      q: 'What is the difference between CONTAINS and FREETEXT in MSSQL?',
      options: [
        'CONTAINS is faster; FREETEXT is more accurate',
        'CONTAINS gives precise control (phrases, proximity, prefix, boolean); FREETEXT uses natural language processing for broader, inflection-aware matching',
        'CONTAINS works on NVARCHAR columns; FREETEXT on VARCHAR only',
        'They are identical — FREETEXT is just a simplified syntax'
      ],
      answer: 1,
      explanation: 'CONTAINS requires explicit predicates (exact word, phrase in quotes, prefix with *, NEAR, AND/OR/NOT). FREETEXT sends the query through linguistic analysis — stemming, thesaurus, inflectional forms — for broader recall without manual boolean logic.'
    },
    {
      q: 'In PostgreSQL, what does setweight do when building a tsvector?',
      options: [
        'Limits the maximum number of tokens in the vector',
        'Assigns importance labels (A–D) to tokens so that matches in higher-weight sections score higher in ts_rank',
        'Removes stop words from the specified weight class',
        'Compresses the tsvector for faster index storage'
      ],
      answer: 1,
      explanation: 'setweight(tsvector, \'A\'|\'B\'|\'C\'|\'D\') annotates each token with a weight class. ts_rank and ts_rank_cd use these weights when scoring — A is the highest weight, D the lowest. Combine title (weight A) with body (weight B) so title matches rank higher.'
    },
    {
      q: 'What does ts_rank() return and how is it used?',
      options: [
        'The row ID of the best matching document',
        'A floating-point relevance score between 0.0 and 1.0 based on term frequency in the tsvector',
        'The position of the first matching token in the document',
        'A count of how many terms in the tsquery matched'
      ],
      answer: 1,
      explanation: 'ts_rank(tsvector, tsquery) returns a relevance score; ts_rank_cd also factors in document length. Use ORDER BY ts_rank(search_col, query) DESC to sort by relevance. The score is relative — it is only meaningful when comparing rows within the same query.'
    },
    {
      q: 'Which index type is preferred for PostgreSQL full-text search on a tsvector column and why?',
      options: [
        'GiST — it is faster for exact lookups',
        'GIN — it stores each lexeme separately, making @@ queries fast for exact token lookup',
        'BRIN — it is the most compact for text data',
        'B-tree — it supports sorting which tsvector needs'
      ],
      answer: 1,
      explanation: 'GIN (Generalized Inverted Index) is the recommended index for full-text search. It maps each lexeme to the list of rows containing it, making @@ queries very fast. GiST is an alternative but has slower lookups and faster updates — appropriate only when updates far outnumber searches.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use full-text search vs a dedicated search engine like Elasticsearch?',
      a: 'Built-in full-text search is a good fit when: your data is already in the database, search is secondary to transactional workloads, and you need simple term/phrase/proximity queries. Use Elasticsearch/OpenSearch when: search is the primary feature, you need faceted search, autocomplete, multi-field boosting, or must search across many tables without joins. Hybrid is common — store in SQL, sync a search index asynchronously.',
    },
    {
      q: 'How do I keep the PostgreSQL tsvector column up to date as rows change?',
      a: 'PostgreSQL 12+ supports GENERATED ALWAYS AS … STORED for tsvector columns — the database updates the column automatically on INSERT/UPDATE. For older versions, use a trigger: CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(search_vector, \'pg_catalog.english\', title, body);',
    },
    {
      q: 'Full-text population in MSSQL is slow — what can I do?',
      a: 'Check FULLTEXTCATALOGPROPERTY(\'catalog\', \'PopulateStatus\') — a value of 1 means population is active. For initial population of large tables: (1) Use CHANGE_TRACKING = MANUAL during migration, populate, then switch to AUTO. (2) Increase ft.crawl_bandwidth_limit and max_range_size in sp_fulltext_service. (3) Ensure the Full-Text Daemon has enough I/O bandwidth. Incremental population (based on timestamp column) is faster than full population for updates.',
    },
    {
      q: 'How do I do phrase search and proximity search in PostgreSQL and MSSQL?',
      a: 'PostgreSQL: use phraseto_tsquery(\'hello world\') to match the words adjacent in order. For proximity, use the <N> operator in tsquery: to_tsquery(\'cat <2> dog\') matches "cat" within 2 positions of "dog". MSSQL: CONTAINS(col, \'NEAR((cat, dog), 2)\') for proximity; exact phrase: CONTAINS(col, \'"hello world"\').',
    },
    {
      q: 'How do I combine full-text search with fuzzy matching in PostgreSQL?',
      a: 'pg_trgm (CREATE EXTENSION pg_trgm) enables trigram similarity search: col % \'search\' or similarity(col, \'search\') > 0.3. This handles typos and partial matches but does not understand word stems. Combine both: use tsvector for precise keyword search and trgm GIN index for fuzzy matching, unioning the result sets or weighting scores.',
    },
    {
      q: 'What language configuration should I choose for a tsvector in PostgreSQL and how does it affect results?',
      a: 'to_tsvector(\'english\', text) uses the English dictionary — it stems words (running → run) and removes stop words (the, a, is). Choose the language matching your content: \'simple\' disables stemming (preserves exact words). \'pg_catalog.english\' is the default. For multilingual content, store the language per row and compute tsvector dynamically or use unaccent + simple configuration.',
    },
  ];
}
