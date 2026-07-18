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
  templateUrl: './shouldbindbodywith-caches-body-for-reuse.html',
  styleUrl: './shouldbindbodywith-caches-body-for-reuse.scss'
})
export class ShouldbindbodywithCachesBodyForReuseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'c.ShouldBindJSON can only genuinely succeed once per request — the body is a stream, not a buffer',
      points: [
        'The main page\'s own theory covers c.ShouldBindJSON and c.BindJSON thoroughly, and every one of its code examples calls one of them exactly once per handler. What it never shows is what happens if a SECOND piece of code — a logging middleware that wants to record the request body, or a second handler function in a chain — also needs to read and bind that same body.',
        'An HTTP request body is fundamentally a stream (an io.Reader under the hood), not a buffer that can be freely re-read. Once c.ShouldBindJSON (or any Bind* method) has consumed it, the underlying reader is exhausted — a second call to c.ShouldBindJSON on the same request returns an error (typically something indicating an empty or already-consumed body), not the same decoded data again.',
        'This is not a Gin-specific limitation invented by the framework — it reflects the actual behavior of net/http\'s own Request.Body, which Gin\'s binding methods read directly. Any code that needs to inspect a request body more than once runs into this same constraint, regardless of which specific binding helper is used to do the reading.',
      ]
    },
    {
      heading: 'ShouldBindBodyWith: caching the body so it CAN be bound more than once',
      points: [
        'Gin provides a dedicated method for exactly this need. Per Gin\'s own documented behavior: "ShouldBindBodyWith is similar with ShouldBindWith, but it stores the request body into the context, and reuse when it is called again." The first call reads and caches the raw body bytes on the Context; every subsequent call reuses that cached copy instead of trying to re-read an already-exhausted stream.',
        'This comes with an explicit, documented tradeoff, stated directly alongside it: "This method reads the body before binding. So you should use ShouldBindWith for better performance if you need to call only once." Caching the body costs an extra buffering step that plain ShouldBindJSON/ShouldBindWith does not pay — the right tool depends on whether the body genuinely needs to be read more than once, not a blanket "always use the safer one" choice.',
        'A realistic scenario where this matters: an audit-logging middleware that needs to record the full raw request body BEFORE the route handler binds it into a struct. Without ShouldBindBodyWith, whichever of the two reads happens first exhausts the body for the other — the middleware and the handler are effectively racing to be the only one that successfully reads the request. With it, both can read the same content, as long as the FIRST of the two calls uses ShouldBindBodyWith to establish the cache.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The problem: a second bind attempt fails',
      language: 'typescript',
      code: `package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

type CreateOrderRequest struct {
    ProductID string \`json:"productId" binding:"required"\`
    Quantity  int    \`json:"quantity"  binding:"required,gt=0"\`
}

// auditMiddleware wants to log the raw request body -- but it uses
// the ORDINARY ShouldBindJSON, which fully consumes the body stream.
func auditMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        var probe CreateOrderRequest
        _ = c.ShouldBindJSON(&probe) // reads and EXHAUSTS the body
        c.Next()
    }
}

func createOrder(c *gin.Context) {
    var req CreateOrderRequest
    // This SECOND ShouldBindJSON call fails -- the request body was
    // already fully consumed by auditMiddleware above. req will be
    // left at its zero value, and err will be non-nil, even though
    // the CLIENT genuinely sent a well-formed JSON body.
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, req)
}

func main() {
    r := gin.Default()
    r.Use(auditMiddleware())
    r.POST("/orders", createOrder)
    r.Run(":8080")
}`,
    },
    {
      label: 'The fix: ShouldBindBodyWith caches the body for reuse',
      language: 'typescript',
      code: `package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
)

type CreateOrderRequest struct {
    ProductID string \`json:"productId" binding:"required"\`
    Quantity  int    \`json:"quantity"  binding:"required,gt=0"\`
}

// auditMiddleware now uses ShouldBindBodyWith -- the FIRST call to
// it caches the raw body on the Context, per Gin's own documented
// behavior: "it stores the request body into the context, and
// reuse when it is called again."
func auditMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        var probe CreateOrderRequest
        _ = c.ShouldBindBodyWith(&probe, binding.JSON)
        c.Next()
    }
}

func createOrder(c *gin.Context) {
    var req CreateOrderRequest
    // This call succeeds, reading the CACHED body the middleware
    // already stored on the Context -- both the middleware and the
    // handler successfully bind the same original request data.
    if err := c.ShouldBindBodyWith(&req, binding.JSON); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, req)
}

func main() {
    r := gin.Default()
    r.Use(auditMiddleware())
    r.POST("/orders", createOrder)
    r.Run(":8080")
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s single POST /webhooks/payment handler only ever binds the request body ONCE — there is no middleware or other code reading the body anywhere else in the chain. A developer, having just learned about ShouldBindBodyWith, proposes switching every ShouldBindJSON call across the whole codebase to ShouldBindBodyWith "to be safe, in case something else needs the body later." Using this subtopic\'s theory, evaluate this proposal.',
    hint: 'What does this subtopic\'s theory say is the explicit, documented tradeoff of ShouldBindBodyWith compared to plain ShouldBindWith/ShouldBindJSON? Does that tradeoff apply, or matter, in a handler where the body genuinely IS only ever read once?',
    solution: 'The proposal is not a good idea as a blanket rule, per this subtopic\'s theory, which quotes Gin\'s own documentation directly on this exact tradeoff: "This method reads the body before binding. So you should use ShouldBindWith for better performance if you need to call only once." For the specific POST /webhooks/payment handler described — where the body genuinely is only ever read once, with no other middleware or code needing it — switching to ShouldBindBodyWith adds the extra body-buffering/caching overhead for zero actual benefit, since there is no second reader that would ever need the cached copy. The "to be safe, in case something else needs the body later" reasoning treats a real, specific tradeoff (extra buffering cost) as free insurance against a hypothetical future need — but per this subtopic\'s theory, the right tool choice depends on whether the body ACTUALLY needs to be read more than once in that specific handler\'s real call chain, not a defensive default applied everywhere. The correct scope for this change is narrow: switch to ShouldBindBodyWith specifically in the handlers (and any earlier middleware in their chain) where a genuine second read is required — like the audit-logging-plus-handler-binding scenario in this subtopic\'s own code examples — and leave every single-read handler, including this payment webhook, using the plain ShouldBindJSON/ShouldBindWith it already has.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A second call to c.ShouldBindJSON on the same request returning an error must be a bug specific to that particular binding call — perhaps a malformed body, an unexpected content type, or a validation failure on the second attempt.',
      reality: 'This subtopic\'s theory and first code example show the actual cause has nothing to do with the body\'s content or the binding call\'s own correctness — the request body is a stream (io.Reader) that gets fully CONSUMED by the first successful bind, per the fundamental behavior of net/http\'s own Request.Body. The second call fails simply because there is nothing left to read, regardless of how well-formed the client\'s original JSON was.'
    },
    {
      thought: 'ShouldBindBodyWith is simply a newer, generally-improved replacement for ShouldBindJSON/ShouldBindWith that should be preferred everywhere going forward, similar to how a framework might deprecate an older API in favor of a strictly better one.',
      reality: 'This subtopic\'s theory quotes Gin\'s own documentation showing these are NOT a strict upgrade relationship — ShouldBindBodyWith exists specifically to solve the multiple-read problem, at an explicit, documented performance cost ("you should use ShouldBindWith for better performance if you need to call only once"). ShouldBindJSON/ShouldBindWith remain the correct, faster choice for the common case of binding a body exactly once.'
    },
    {
      thought: 'The order in which auditMiddleware and the route handler call ShouldBindBodyWith does not matter — as long as BOTH of them use ShouldBindBodyWith instead of the ordinary ShouldBindJSON, the caching mechanism handles making the data available to whichever one runs first.',
      reality: 'This subtopic\'s second code example shows the caching is genuinely established by whichever call happens FIRST in execution order — the first ShouldBindBodyWith call reads the real (uncached) body and stores it; every SUBSEQUENT call (in the same or later code in the chain) reuses that cached copy. If any code between the two calls uses a plain ShouldBindJSON/ShouldBindWith instead (exhausting the body without caching it), the mechanism this subtopic describes breaks down regardless of what the other call site uses.'
    }
  ];
}
