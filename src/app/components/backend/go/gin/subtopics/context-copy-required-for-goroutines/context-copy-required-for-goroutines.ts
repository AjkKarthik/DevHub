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
  templateUrl: './context-copy-required-for-goroutines.html',
  styleUrl: './context-copy-required-for-goroutines.scss'
})
export class ContextCopyRequiredForGoroutinesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'gin.Context is tied to the request\'s lifecycle — it is not safe to use after that handler function returns',
      points: [
        'The main page\'s own theory describes gin.Context as the object that "merges http.Request and http.ResponseWriter into one convenient object," and every one of its code examples uses c synchronously — read from c, call c.JSON, return. None of them show what happens if a handler needs to do work AFTER responding, in a separate goroutine, using data from the request.',
        'Gin\'s own documentation for Context.Copy() states the constraint directly: "Copy returns a copy of the current context that can be safely used outside the request\'s scope. This has to be used when the context has to be passed to a goroutine." The phrasing "has to be used" is not a suggestion — it is describing a hard requirement, not an optional safety net.',
        'The underlying reason is that Gin reuses Context objects across requests for performance — internally, a Context is drawn from a pool and returned to that pool once the handler chain finishes, to avoid allocating a fresh one for every single request. A goroutine holding a reference to the ORIGINAL (uncopied) Context can end up reading or writing fields that have already been reset and reassigned to a completely different, later, unrelated request by the time that goroutine actually runs.',
      ]
    },
    {
      heading: 'What Copy() actually solves, and the pattern for using it correctly',
      points: [
        'Copy() produces an independent snapshot of the Context\'s request-scoped data (values set via c.Set, request details, etc.) that is safe to read from a goroutine launched from within the handler — it detaches that goroutine\'s view of the request from the original Context\'s own pooled lifecycle, so the goroutine keeps working with a stable snapshot even after the original Context has been recycled for a new request.',
        'The correct pattern is to call cCopy := c.Copy() BEFORE launching the goroutine, and have the goroutine close over and use cCopy exclusively — never the original c. This is a common, real need in Gin handlers that fire off background work triggered by a request: logging to an external system, publishing an event, or kicking off an async job, all of which should not block the response but still need request-scoped data like a trace ID or the authenticated user set earlier in the middleware chain.',
        'This directly extends the main page\'s own middleware pattern — "c.Set(\'userID\', \'user-42\')... c.MustGet(\'userID\').(string)" — into the async case: reading c.MustGet inside a goroutine using the ORIGINAL context risks reading it after the pool has recycled that Context for a different request, silently returning wrong or missing data; reading the same value from a properly Copy()\'d context does not have this risk, since the copy is fully detached from the pool\'s reuse cycle.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The risk: using the original Context inside a goroutine',
      language: 'typescript',
      code: `package main

import (
    "log"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
)

func createOrder(c *gin.Context) {
    userID := c.MustGet("userID").(string) // set by earlier auth middleware
    c.JSON(http.StatusCreated, gin.H{"status": "order created"})

    // RISKY: this goroutine closes over the ORIGINAL Context "c".
    // By the time this goroutine actually runs, Gin may have already
    // returned "c" to its internal pool and reused it for a
    // COMPLETELY DIFFERENT, later request -- reading from "c" here
    // is not guaranteed to still reflect THIS request at all.
    go func() {
        time.Sleep(50 * time.Millisecond) // simulates async work
        // c.MustGet("userID") here is UNDEFINED BEHAVIOR per Gin's
        // own documented Context lifecycle -- it might work by luck
        // in testing and fail unpredictably under real load, once
        // the pool is actually recycling Contexts across concurrent
        // requests.
        log.Println("async audit log for user:", userID) // captured
                                                             // BEFORE the
                                                             // goroutine,
                                                             // so this
                                                             // specific
                                                             // line is
                                                             // actually
                                                             // safe --
                                                             // but any
                                                             // NEW read
                                                             // from c
                                                             // inside
                                                             // the
                                                             // goroutine
                                                             // would not be.
    }()
}

func main() {
    r := gin.Default()
    r.POST("/orders", createOrder)
    r.Run(":8080")
}`,
    },
    {
      label: 'The fix: Copy() before launching the goroutine',
      language: 'typescript',
      code: `package main

import (
    "log"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
)

func createOrder(c *gin.Context) {
    userID := c.MustGet("userID").(string)
    c.JSON(http.StatusCreated, gin.H{"status": "order created"})

    // Copy() BEFORE launching the goroutine -- per Gin's own docs,
    // this "has to be used when the context has to be passed to a
    // goroutine." cCopy is fully detached from the pool's reuse
    // cycle for the original "c".
    cCopy := c.Copy()

    go func() {
        time.Sleep(50 * time.Millisecond)
        // Safe: reading from cCopy, not the original, possibly
        // already-recycled "c" -- this is guaranteed to still
        // reflect THIS request's own data, regardless of how many
        // other requests Gin has processed and recycled Contexts
        // for in the meantime.
        traceID := cCopy.GetString("traceID")
        log.Println("async audit log, trace:", traceID, "user:", userID)
    }()
}

func main() {
    r := gin.Default()
    r.Use(func(c *gin.Context) {
        c.Set("traceID", "trace-abc123")
        c.Next()
    })
    r.POST("/orders", createOrder)
    r.Run(":8080")
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A handler function reads several values from gin.Context via c.MustGet BEFORE launching a background goroutine, storing them in local variables, and the goroutine only ever references those local variables — never c itself. A teammate reviewing the PR insists this still needs c.Copy() "to be safe," but the original author argues Copy() is unnecessary here since the goroutine never touches c at all. Using this subtopic\'s theory, determine who is correct, and explain precisely why.',
    hint: 'This subtopic\'s theory says the risk is specifically about a goroutine reading (or writing) the CONTEXT OBJECT ITSELF after it may have been recycled — not about using data that was already extracted from it. Does capturing values into plain local variables, entirely separate from the Context object, still carry that same risk?',
    solution: 'The original author is correct in this specific case, and Copy() is genuinely unnecessary here — though the reasoning matters more than the conclusion. Per this subtopic\'s theory, the actual risk Copy() protects against is a goroutine reading or writing THE CONTEXT OBJECT ITSELF after Gin may have already returned it to its internal pool and reused it for a different request — "this has to be used when the context has to be passed to a goroutine," specifically when the CONTEXT is what crosses into the goroutine. If every value the goroutine needs is extracted into ordinary local variables (like userID := c.MustGet("userID").(string)) BEFORE the goroutine is launched, and the goroutine\'s closure only ever references those independent local variables — never c itself — there is no remaining reference to the pooled Context object inside the goroutine at all, and therefore nothing that could be corrupted by the Context being recycled for a later request. This is precisely the safe pattern already demonstrated in this subtopic\'s own first code example\'s userID line (captured before the goroutine, used safely inside it) — the RISKY part of that same example was a hypothetical NEW read from c happening inside the goroutine, not the pre-captured value. The teammate\'s instinct to be cautious around goroutines and gin.Context is reasonable as a general habit, but applying c.Copy() as a blanket rule regardless of whether the Context object itself actually crosses into the goroutine reflects a misunderstanding of exactly what Copy() protects against.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any goroutine launched from inside a Gin handler needs to use c.Copy() somewhere, as a general safety rule — the risk of using the "wrong" gin.Context is broad enough that it is best to always Copy() defensively whenever a goroutine is involved, regardless of exactly what data it needs.',
      reality: 'This subtopic\'s theory and exercise show the risk is specific and narrow: it applies when the goroutine needs to read or write the CONTEXT OBJECT ITSELF after launch. If all needed values are extracted into plain local variables BEFORE the goroutine starts, and the goroutine\'s closure never references the Context object again, there is nothing left that Copy() would need to protect — applying it reflexively in every goroutine-adjacent handler is unnecessary caution, not a genuine safety requirement in that case.'
    },
    {
      thought: 'gin.Context becoming invalid after a handler returns is similar to any other Go value going out of scope — Go\'s garbage collector will simply keep the Context object alive as long as the goroutine still holds a reference to it, the same way GC keeps any referenced value alive, so there is no real correctness risk, just a potential memory-retention one.',
      reality: 'This subtopic\'s theory describes a fundamentally different mechanism than garbage collection: Gin explicitly POOLS and REUSES Context objects for performance, actively resetting and reassigning an existing Context\'s fields to a NEW, unrelated request rather than waiting for the old one to be garbage collected. A goroutine holding a reference to that same Context object will NOT see it kept "frozen" for the old request — it will observe live mutations belonging to whatever new request Gin has since reused that Context object for, which is a genuine correctness bug, not merely a memory-lifetime concern GC would resolve safely.'
    },
    {
      thought: 'c.Copy() performs a deep, expensive clone of the entire request (including re-reading the body, headers, and every internal field) — it should be avoided except when absolutely necessary due to its performance cost.',
      reality: 'This subtopic\'s theory describes Copy() as producing "an independent snapshot of the Context\'s request-scoped data... safe to read from a goroutine" — it is a lightweight, purpose-built operation for exactly this use case, not a heavyweight deep-clone of the underlying HTTP request/response machinery. The genuine consideration is correctness (using it when a goroutine needs the Context object itself), not treating it as an expensive operation to minimize.'
    }
  ];
}
