import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-offset-pagination-mid-change-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './offset-pagination-skips-or-duplicates-rows-when-data-changes-mid-pagination.html',
  styleUrl: './offset-pagination-skips-or-duplicates-rows-when-data-changes-mid-pagination.scss',
})
export class OffsetPaginationSkipsOrDuplicatesRowsWhenDataChangesMidPaginationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Frames Keyset Pagination as a Performance Fix — It Is Also a Correctness Fix',
      points: [
        'The main page\'s own OFFSET/FETCH and LIMIT/OFFSET examples paginate by counting rows from the start of the ordered result — "skip n, take m." That count is purely POSITIONAL: it says nothing about which specific rows those positions refer to. If a row is inserted or deleted anywhere before the current page\'s window, between the time a user requests page 1 and page 2 — an entirely ordinary occurrence for any live orders table — the set of rows now sitting at "position 21-30" has shifted, even though nothing about the user\'s own request changed.',
        'The main page introduces keyset pagination (WHERE order_id > @last_seen_id) purely as a fix for the deep-offset performance problem. It never mentions that keyset pagination also happens to fix a completely different, equally real problem: because it is defined by a stable KEY VALUE rather than a POSITIONAL COUNT, concurrent inserts or deletes elsewhere in the table never shift what a given page returns — the correctness benefit is a free side effect of the same technique recommended for a different reason.',
      ],
    },
    {
      heading: 'Concretely: a Row Can Appear on Two Consecutive Pages, or Vanish Entirely',
      points: [
        'Order rows shown DESC by order_date. Page 1 (OFFSET 0 FETCH NEXT 15) returns the 15 most recent orders. Before the user requests page 2, a brand-new order is inserted with a later order_date than everything currently shown. Page 2 (OFFSET 15 FETCH NEXT 15) now returns a window that has shifted down by one position — the row that was in position 15 on page 1 is now in position 16, landing on page 2 as well. The user sees that same order twice, once per page.',
        'The mirror-image failure: if a row is DELETED from earlier in the ordering between page requests, everything shifts UP by one, and whatever row would have been at the boundary between page 1 and page 2 is skipped entirely — never shown on either page.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the duplicate-row case (OFFSET pagination)',
      language: 'sql',
      code: `-- Page 1: most recent 3 orders, ordered by order_date DESC
SELECT order_id, order_date FROM orders
ORDER BY order_date DESC
OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY;
-- Returns, say: order_id 103, 102, 101 (in that order)

-- Before requesting page 2, a NEW order is inserted with a LATER date:
INSERT INTO orders (order_id, order_date) VALUES (104, /* later than 103 */ DEFAULT);

-- Page 2: the window has shifted down by exactly one position
SELECT order_id, order_date FROM orders
ORDER BY order_date DESC
OFFSET 3 ROWS FETCH NEXT 3 ROWS ONLY;
-- Returns order_id 101 again -- it was position 3 (on page 1) and is now
-- position 4 (page 2's first row), because 104 pushed everything down.
-- The user sees order 101 on BOTH page 1 and page 2.`,
    },
    {
      label: 'Keyset pagination is immune to the same insert',
      language: 'sql',
      code: `-- Page 1: same 3 most recent orders, via keyset instead of OFFSET
SELECT order_id, order_date FROM orders
ORDER BY order_id DESC
LIMIT 3;
-- Returns order_id 103, 102, 101 -- remember the last one: 101

-- The same insert happens before page 2 is requested:
INSERT INTO orders (order_id, order_date) VALUES (104, /* later date */ DEFAULT);

-- Page 2: seek from the last-seen KEY, not a row COUNT
SELECT order_id, order_date FROM orders
WHERE order_id < 101          -- last_seen_id from page 1, not a position
ORDER BY order_id DESC
LIMIT 3;
-- Returns order_id 100, 99, 98 -- exactly the next 3 after 101, completely
-- unaffected by the new row 104 landing ahead of the whole window.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A live "recent orders" feed uses OFFSET-based pagination as shown on the main page. Support gets an intermittent report of the same order appearing twice across two consecutive page loads, but only during business hours when order volume is high — never during off-hours testing. What\'s the mechanism, and why does it only show up under real traffic?',
    hint: 'Think about what has to happen, specifically, between the moment a user loads page 1 and the moment they load page 2, for the bug in the code tabs above to occur.',
    solution: `The mechanism is exactly the one demonstrated above: a new order gets
inserted with a later order_date sometime between the user's page 1
request and their page 2 request, shifting every subsequent row's
position down by one and causing whatever was at the page boundary to
appear on both pages.

It only shows up under real, concurrent traffic because it depends on
a NEW order being inserted during that specific narrow window between
one user's two page requests -- a purely single-user, off-hours test
never has another order arriving mid-pagination, so the positional
window never shifts and the bug never reproduces. The bug rate scales
directly with how many orders get inserted per second relative to how
long users take to click "next page" -- exactly the pattern of "only
during business hours, high volume."

Switching to keyset pagination (WHERE order_id < @last_seen_id ORDER
BY order_id DESC LIMIT n) removes the dependency on row position
entirely, eliminating this class of bug regardless of concurrent
insert volume.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own reason for recommending keyset pagination over OFFSET is purely about performance on deep pages.',
      reality: 'keyset pagination also fixes a completely separate correctness problem the main page never mentions -- OFFSET-based paging can skip or duplicate rows whenever the underlying data changes between page requests, something keyset pagination is immune to by construction.',
    },
    {
      thought: 'a user seeing the same row twice across two page loads must be an application-level bug (e.g. a caching issue or a double-render), not something the SQL pagination strategy itself can cause.',
      reality: 'OFFSET-based SQL pagination can produce this exact symptom entirely on its own -- a single concurrent insert or delete between two page requests shifts the positional window and can duplicate or skip a row, with the SQL layer never returning an error or any indication anything went wrong.',
    },
    {
      thought: 'this problem only matters for extremely high-traffic tables where inserts happen every millisecond.',
      reality: 'it only takes ONE insert or delete anywhere in the qualifying row set between two specific page requests -- for a live orders table during business hours, that is a routine occurrence, not an extreme edge case.',
    },
  ];
}
