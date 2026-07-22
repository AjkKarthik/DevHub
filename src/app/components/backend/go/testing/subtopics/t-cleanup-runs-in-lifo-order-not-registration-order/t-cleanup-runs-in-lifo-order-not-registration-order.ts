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
  templateUrl: './t-cleanup-runs-in-lifo-order-not-registration-order.html',
  styleUrl: './t-cleanup-runs-in-lifo-order-not-registration-order.scss'
})
export class TCleanupRunsInLifoOrderNotRegistrationOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses t.Cleanup once, as a single call, with no ordering guarantee ever discussed',
      points: [
        'The main page\'s own mistake entry ("Calling os.Exit in tests instead of t.FailNow") shows exactly one t.Cleanup(func() { teardown() }) call, contrasted against os.Exit skipping it. Its theory never mentions what happens when a test registers MULTIPLE cleanup functions — an extremely common pattern once a test sets up more than one resource (a temp file, then a DB connection, then an HTTP test server).',
        'The official testing package documentation for Cleanup is explicit about ordering: "Cleanup functions will be called in last added, first called order." This is the standard LIFO (last-in, first-out) stack discipline — the SAME ordering defer already uses within a single function, extended here across an entire test (and, per the same documentation, run "when the test (or subtest) and all its subtests complete").',
        'This ordering is not an implementation detail to memorize in isolation — it is exactly why t.Cleanup composes safely for teardown: if setup order is (1) open temp dir, (2) start DB inside it, (3) start an HTTP server using that DB, then LIFO teardown order — (3) stop server, (2) close DB, (1) remove temp dir — is precisely the SAFE order, since each resource is torn down before the one it depends on.',
      ]
    },
    {
      heading: 'Getting this wrong produces working code that fails only under a specific, less common setup order',
      points: [
        'A test that happens to register cleanups in an order where LIFO and registration order coincide (a single resource, or resources with no dependency relationship) will behave identically regardless of whether the developer understood the LIFO guarantee — the bug is invisible until a test registers DEPENDENT resources in their natural setup order and assumes cleanup mirrors that SAME order (first-registered-runs-first), rather than the actual reverse.',
        'This mirrors — deliberately — the exact ordering discipline Go developers already rely on for defer inside a single function body: multiple defer statements in one function unwind in LIFO order for the identical reason (each deferred cleanup should be safe to run before whatever was set up earlier in the function, which is a dependency, not the reverse). t.Cleanup extends that same discipline from "within one function" to "across a whole test, including its subtests."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Multiple t.Cleanup calls -- teardown unwinds in reverse',
      language: 'typescript',
      code: `package integration

import (
    "os"
    "testing"
)

func TestUserWorkflow(t *testing.T) {
    // Setup order: temp dir -> DB inside it -> HTTP server using the DB.
    // Each resource DEPENDS on the one registered before it.

    dir, err := os.MkdirTemp("", "testdb-*")
    if err != nil {
        t.Fatal(err)
    }
    t.Cleanup(func() {
        os.RemoveAll(dir) // registered 1st -- must run LAST
        println("cleanup: removed temp dir")
    })

    db := openTestDB(dir)
    t.Cleanup(func() {
        db.Close() // registered 2nd -- must run 2nd-to-last
        println("cleanup: closed db")
    })

    srv := startTestServer(db)
    t.Cleanup(func() {
        srv.Close() // registered 3rd -- must run FIRST
        println("cleanup: closed server")
    })

    // ... test body uses srv, db, dir ...

    // Per the testing package's own documentation -- "Cleanup
    // functions will be called in last added, first called order"
    // -- teardown output, regardless of what the test body does, is:
    //
    // cleanup: closed server
    // cleanup: closed db
    // cleanup: removed temp dir
    //
    // Exactly the reverse of registration -- and exactly the only
    // SAFE order, since closing the server first means it never
    // tries to use a db that's already closed, and closing the db
    // before removing dir means nothing is mid-write when the temp
    // directory disappears.
}`,
    },
    {
      label: 'What would break if cleanup ran in registration order instead',
      language: 'typescript',
      code: `// Hypothetical -- NOT how t.Cleanup actually behaves, shown to
// illustrate exactly why LIFO order matters here:
//
// If cleanup ran in REGISTRATION order (which it does NOT):
//
// 1. os.RemoveAll(dir)   -- deletes the directory the DB's files
//                            live in, WHILE the db connection is
//                            still open
// 2. db.Close()          -- attempts to flush/close a database
//                            whose underlying files were just
//                            deleted out from under it -- likely
//                            errors, or silently does nothing useful
// 3. srv.Close()         -- attempts to gracefully shut down a
//                            server whose db dependency is already
//                            gone -- in-flight requests using db
//                            during shutdown would fail unexpectedly
//
// The testing package's own documented LIFO guarantee -- "last
// added, first called" -- is precisely what prevents this: it
// guarantees teardown always happens in the safe, dependency-aware
// reverse order, without the test author needing to manually order
// cleanup calls themselves (the way a single hand-written teardown
// function would require getting right by hand, and could easily
// get wrong).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test sets up three resources in this order, registering a t.Cleanup immediately after creating each one: (1) start a Docker test container running a Kafka broker, (2) create a Kafka test topic on that broker, (3) open a consumer connection to that topic. Using this subtopic\'s theory, predict the actual teardown order once the test ends, and explain why that order — rather than the registration order — is the safe one for these three specific, dependent resources.',
    hint: 'Per this subtopic\'s theory, does t.Cleanup run registered functions in the order they were added, or in the reverse? Of the three resources here, which one depends on which — does the consumer connection depend on the topic existing, and does the topic depend on the broker container running?',
    solution: 'Per this subtopic\'s theory — "Cleanup functions will be called in last added, first called order" — teardown runs in the exact reverse of registration: (3) close the consumer connection first, (2) delete the Kafka topic second, (1) stop the Docker container last. This is the safe order because each resource here depends on the one registered before it: the consumer connection depends on the topic existing, and the topic depends on the broker container running. Reversing registration order means each resource is always torn down BEFORE the thing it depends on — the connection closes while the topic and broker still exist to receive that close cleanly, the topic is deleted while the broker is still running to process the deletion, and the container is stopped last, once nothing still depends on it. This is exactly the same dependency-respecting logic this subtopic\'s first code example shows for the temp-dir/db/server case — the specific resources differ, but the underlying reason LIFO order is the safe order is identical: setup order naturally reflects a dependency chain, and reversing it for teardown respects that chain automatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Multiple t.Cleanup functions registered during a test run in the same order they were registered — the first t.Cleanup call in the test body is the first cleanup to execute when the test ends.',
      reality: 'This subtopic\'s theory quotes the documentation directly: "Cleanup functions will be called in last added, first called order." Execution is LIFO — the reverse of registration order — the exact same discipline Go\'s own defer statement already uses within a single function.'
    },
    {
      thought: 'The order t.Cleanup functions run in is an implementation detail that mostly does not matter, since each cleanup function is typically independent of the others.',
      reality: 'This subtopic\'s theory and second code example show the ordering specifically matters whenever cleanups tear down resources with a DEPENDENCY relationship (a server using a database, a database living inside a temp directory) — running them in the wrong order (registration order instead of LIFO) would tear down a depended-upon resource before the thing depending on it, causing errors or silent no-ops during teardown.'
    },
    {
      thought: 't.Cleanup\'s LIFO ordering is a completely different, unrelated mechanism from Go\'s ordinary defer statement, since one is a testing-package feature and the other is a language keyword.',
      reality: 'This subtopic\'s theory explicitly connects the two: t.Cleanup extends the exact same LIFO discipline defer already provides within a single function, just scoped across an entire test (and its subtests) instead of a single function body — the same reasoning that makes defer safe for nested resource cleanup applies identically to t.Cleanup.'
    }
  ];
}
