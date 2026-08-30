import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './feed-read-code-still-joined-what-denorm-was-for.html',
  styleUrl: './feed-read-code-still-joined-what-denorm-was-for.scss'
})
export class FeedReadCodeStillJoinedWhatDenormWasForSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A JOIN that quietly undid the page\'s own denormalization plan',
      points: [
        'The main page repeatedly recommends denormalizing author data (username, avatar) directly onto each post\'s row at write time specifically so the hot feed-read path never has to look up author data in a separate table. Yet the page\'s own "Feed Read" code sample, step 5 (batch-fetching post data for a rendered feed), used: SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id IN (?) — a JOIN against the users table on exactly the hot read path the denormalization was meant to protect. The page has been corrected.',
        'This is catchable purely by reading the page\'s OWN two claims against each other: it argues FOR denormalizing author fields onto posts, then writes a read query that ignores its own denormalized fields and joins live instead.',
      ]
    },
    {
      heading: 'Why this specific JOIN defeats the purpose of denormalizing',
      points: [
        'Denormalization\'s entire benefit on a feed-read hot path is turning an N-table lookup into a single-table lookup — avoiding both the JOIN\'s own execution cost AND the extra index traversal into the users table for every single post row.',
        'A batch feed read (per the page\'s own numbers, fetching up to 1,000 post IDs per feed load, at the corrected ~5,800 reads/sec) that still JOINs against users for every batch pays that join cost on every single request — exactly the workload denormalization is supposed to shield from the users table entirely.',
        'The fix is a single-table SELECT that reads the already-denormalized author_username / author_avatar columns directly off the posts row: SELECT id, author_id, content, created_at, author_username, author_avatar FROM posts WHERE id IN (?) — no JOIN needed at all, matching what the page\'s own denormalization advice actually promised.',
      ]
    },
    {
      heading: 'The tradeoff this JOIN was (accidentally) reintroducing',
      points: [
        'Denormalization is a deliberate write-time cost (an extra write, or a background job, to keep author_username/author_avatar in sync whenever a user changes their name or avatar) taken specifically to make read-time cheap. A stray JOIN on the read path pays BOTH costs at once: the write-time sync overhead of maintaining denormalized columns, and the read-time cost of a live JOIN that those columns were supposed to make unnecessary — the worst of both approaches, not a genuine hybrid.',
        'This is a useful category of bug to watch for in any system-design write-up: a page can correctly ARGUE for a technique in prose while a code sample elsewhere on the same page quietly fails to apply it — the prose and the code need to be checked against each other, not just each independently checked for correctness.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Joined read vs. denormalized single-table read',
      language: 'typescript',
      code: `// Before: JOIN on the hot feed-read path -- undoes denormalization
async function feedReadWithJoin(db: Db, postIds: string[]) {
  return db.query(
    'SELECT p.*, u.username, u.avatar ' +
    'FROM posts p JOIN users u ON p.author_id = u.id ' +
    'WHERE p.id IN (?)',
    [postIds]
  );
  // Pays JOIN cost + users-table index traversal on EVERY
  // feed read, exactly the cost denormalization was meant to avoid.
}

// After: single-table read using already-denormalized columns
async function feedReadDenormalized(db: Db, postIds: string[]) {
  return db.query(
    'SELECT id, author_id, content, created_at, ' +
    '       author_username, author_avatar ' +
    'FROM posts WHERE id IN (?)',
    [postIds]
  );
  // author_username / author_avatar were written onto the posts
  // row at post-creation time (or synced via background job on
  // profile update) -- no users-table lookup needed here at all.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design write-up argues at length for denormalizing author username/avatar onto each post row specifically to keep the feed-read path fast, then shows a "Feed Read" code sample that runs SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id IN (?). What is inconsistent here, and what should the query look like instead?',
    hint: 'If author_username and author_avatar are already stored as columns directly on the posts table, does the feed-read query need to touch the users table at all?',
    solution: 'The JOIN contradicts the page\'s own denormalization advice — if author_username and author_avatar are already copied onto each posts row at write time, the feed-read path never needs to touch the users table, since the data it would JOIN for is already sitting on the row it\'s already fetching. The corrected query is a single-table SELECT: SELECT id, author_id, content, created_at, author_username, author_avatar FROM posts WHERE id IN (?) — no JOIN clause, no users-table access at all. Leaving the JOIN in place means paying both the write-time cost of maintaining the denormalized columns AND the read-time cost the denormalization was supposed to eliminate — the worst of both approaches.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as a system design write-up correctly explains WHY denormalization helps in its prose, the accompanying code samples are very likely to correctly apply that same technique.',
      reality: 'Per this subtopic\'s theory, this page\'s own "Feed Read" code sample directly contradicted its own denormalization advice by joining against the users table anyway — prose and code need to be checked against each other, not assumed consistent just because the prose is correct.'
    },
    {
      thought: 'A JOIN against a small, simple table like users is cheap enough that it does not meaningfully undercut a denormalization strategy, even on a hot read path.',
      reality: 'Per this subtopic\'s theory, the entire point of denormalizing onto the hot-path table is to avoid paying ANY per-row join/lookup cost against a second table on that path — reintroducing the JOIN pays that cost on every single feed read (at the corrected ~5,800 reads/sec), which is exactly the overhead denormalization exists to eliminate.'
    },
    {
      thought: 'If a table has denormalized columns for convenience, using either the denormalized columns OR a live JOIN to get the same data is basically an equivalent choice.',
      reality: 'Per this subtopic\'s theory, choosing the JOIN when denormalized columns already exist means paying BOTH the write-time cost of keeping those columns in sync AND the read-time cost the columns were meant to eliminate — strictly worse than picking one approach and committing to it.'
    }
  ];
}
