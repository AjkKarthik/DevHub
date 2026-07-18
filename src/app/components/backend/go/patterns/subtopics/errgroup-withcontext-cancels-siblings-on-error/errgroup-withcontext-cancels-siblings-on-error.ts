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
  templateUrl: './errgroup-withcontext-cancels-siblings-on-error.html',
  styleUrl: './errgroup-withcontext-cancels-siblings-on-error.scss'
})
export class ErrgroupWithcontextCancelsSiblingsOnErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own fetchAll() shadows ctx with errgroup\'s derived context, but never uses it',
      points: [
        'The main page\'s errgroup & Fan-out code tab writes g, ctx := errgroup.WithContext(ctx) — shadowing the incoming ctx parameter with a NEW one returned by WithContext. Its theory says only "errgroup.Group (golang.org/x/sync): runs goroutines concurrently, collects the first error, and cancels a shared context," without explaining exactly what that derived context does or when it actually matters.',
        'The golang.org/x/sync/errgroup documentation is precise about the mechanism: "WithContext returns a new Group and an associated Context derived from ctx. The derived Context is canceled the first time a function passed to Go returns a non-nil error or the first time Wait returns, whichever occurs first."',
        'So the derived ctx becomes Done() as soon as ANY goroutine in the group returns an error — not just the one that failed. That is the entire point of shadowing ctx: sibling goroutines that are still running can watch this new ctx.Done() and stop early instead of continuing to do wasted work after the group has already decided it failed.',
      ]
    },
    {
      heading: 'The main page\'s own fetchAll body never actually watches ctx.Done() — so its goroutines get zero benefit from the cancellation',
      points: [
        'Look closely at the main page\'s own g.Go(func() error { ... }) body inside fetchAll: it simulates a fetch and returns an error for one bad URL, but nothing inside that closure ever calls ctx.Done(), ctx.Err(), or passes ctx into whatever performed the actual fetch. The shadowed ctx from WithContext is captured by the closure (it is in scope) but is never read.',
        'The practical consequence: even though errgroup.WithContext IS canceling the derived context the instant the bad URL\'s goroutine returns its error, every OTHER goroutine in that same call to fetchAll keeps running its simulated fetch to completion regardless — there is no code path that would make them stop early. WithContext alone provides the SIGNAL; each goroutine must still choose to check it.',
        'This is not a bug in the sense that fetchAll produces a wrong answer — g.Wait() still correctly returns the first error, and the function is still correct — it is simply a missed optimization: in a real HTTP-fetch version of this function (not the main page\'s simplified simulation), an in-flight request.Do(req.WithContext(ctx)) call passed that same derived ctx would actually be aborted early once a sibling fails, saving real network time and server resources instead of running every request to completion regardless of the group\'s outcome.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own fetchAll -- ctx is derived but never checked',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"

    "golang.org/x/sync/errgroup"
)

func fetchAll(ctx context.Context, urls []string) ([]string, error) {
    results := make([]string, len(urls))
    g, ctx := errgroup.WithContext(ctx) // ctx is now the DERIVED context --
                                          // canceled as soon as ANY g.Go
                                          // func returns a non-nil error.

    for i, url := range urls {
        i, url := i, url
        g.Go(func() error {
            // This closure captures "ctx" (the derived one) but never
            // reads it -- no select on ctx.Done(), no ctx.Err() check.
            // If url is bad and returns early, ctx becomes Done() --
            // but every OTHER still-running goroutine here has no way
            // to notice, since nothing in this body looks at ctx at all.
            if url == "https://bad.example.com" {
                return fmt.Errorf("fetch %s: connection refused", url)
            }
            results[i] = "response from " + url
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err // still correct -- just not early-exiting siblings
    }
    return results, nil
}`,
    },
    {
      label: 'The fix -- goroutines select on the derived ctx to actually stop early',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"

    "golang.org/x/sync/errgroup"
)

// simulateSlowFetch pretends to do real network I/O that can be
// interrupted -- unlike the main page's instant simulated fetch.
func simulateSlowFetch(ctx context.Context, url string) (string, error) {
    select {
    case <-time.After(200 * time.Millisecond): // pretend network latency
        return "response from " + url, nil
    case <-ctx.Done():
        // The derived ctx was canceled by a SIBLING goroutine's error --
        // per the docs: "canceled the first time a function passed to
        // Go returns a non-nil error." Stop wasting time immediately.
        return "", ctx.Err()
    }
}

func fetchAll(ctx context.Context, urls []string) ([]string, error) {
    results := make([]string, len(urls))
    g, ctx := errgroup.WithContext(ctx)

    for i, url := range urls {
        i, url := i, url
        g.Go(func() error {
            if url == "https://bad.example.com" {
                // This error cancels ctx for every sibling goroutine
                // immediately -- per errgroup's own documented behavior.
                return fmt.Errorf("fetch %s: connection refused", url)
            }
            res, err := simulateSlowFetch(ctx, url)
            if err != nil {
                return err // returns ctx.Err() -- "context canceled"
            }
            results[i] = res
            return nil
        })
    }

    // g.Wait() still blocks until every goroutine returns -- per the
    // docs, "Wait blocks until all function calls... have returned" --
    // but now the slow ones return almost immediately via ctx.Done()
    // instead of running their full 200ms each.
    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own fetchAll() verbatim into a real service that calls 50 external APIs concurrently via g.Go(). One API call fails almost instantly (bad URL, connection refused). The other 49 goroutines are each making a real, slow HTTP request that takes 3 full seconds. Using this subtopic\'s theory, predict roughly how long fetchAll() takes to return in this copied-verbatim version, and explain what a single one-line change to each goroutine\'s HTTP call would need to do to make it return almost immediately instead.',
    hint: 'Per this subtopic\'s theory, does errgroup.WithContext canceling its derived ctx do anything BY ITSELF to an HTTP request that is already in flight? What does Wait() actually wait for, per its own documented behavior quoted in this subtopic?',
    solution: 'fetchAll() takes roughly 3 seconds to return — NOT almost-instantly, even though one goroutine fails immediately and cancels the derived ctx right away. This is because, per this subtopic\'s theory, g.Wait() "blocks until all function calls... have returned," and the 49 goroutines making real slow HTTP requests are never told to stop: the main page\'s own verbatim fetchAll code never passes the derived ctx into the actual HTTP call, so errgroup.WithContext canceling ctx has no effect on requests that never check it. The fix is passing the derived ctx into each request so it can actually be aborted — e.g. req, _ := http.NewRequestWithContext(ctx, "GET", url, nil) instead of http.Get(url) — since NewRequestWithContext wires the request up to be canceled the moment ctx.Done() fires, which happens per this subtopic\'s theory "the first time a function passed to Go returns a non-nil error." With that one change, all 49 in-flight requests abort within roughly the time it takes the failing goroutine to return its error, not the full 3 seconds each would otherwise take.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'errgroup.WithContext automatically stops every other in-flight goroutine\'s work the instant one of them returns an error, just by virtue of using WithContext instead of a plain errgroup.Group{}.',
      reality: 'This subtopic\'s theory and first code example show WithContext only cancels the DERIVED CONTEXT — it does not preempt or interrupt code that is already running. Each goroutine must itself select on ctx.Done() (or check ctx.Err()) to notice the cancellation and actually stop; without that, WithContext provides a signal nobody is listening for, exactly as in the main page\'s own unmodified fetchAll.'
    },
    {
      thought: 'g.Wait() returns as soon as the FIRST error is captured, so a failing goroutine short-circuits the rest of the group\'s runtime automatically.',
      reality: 'This subtopic\'s theory quotes the documentation directly: "Wait blocks until all function calls from the Go method have returned, then returns the first non-nil error (if any) from them." Wait always waits for every goroutine to finish, regardless of when the first error occurred — the exercise shows this can mean waiting the FULL duration of the slowest unrelated goroutine even after the group has already failed.'
    },
    {
      thought: 'Since g.Go(func() error {...}) is called through the errgroup.Group returned by WithContext, the goroutines it launches automatically inherit cancellation-checking behavior from the group itself.',
      reality: 'This subtopic\'s theory shows g.Go() only tracks the goroutine for completion (like a WaitGroup) and captures its returned error — it does not inject any cancellation logic into the goroutine\'s body. The manual discipline of checking ctx.Done() or ctx.Err() inside the goroutine is exactly the same requirement as with a plain context.Context and no errgroup involved at all.'
    }
  ];
}
