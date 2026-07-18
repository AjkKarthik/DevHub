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
  templateUrl: './each-withvalue-call-wraps-a-new-node.html',
  styleUrl: './each-withvalue-call-wraps-a-new-node.scss'
})
export class EachWithvalueCallWrapsANewNodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'context.WithValue does not add a key to a shared map — it wraps the parent in a brand-new, single-key node',
      points: [
        'The main page\'s own WithValue example shows exactly one call: context.WithValue(ctx, requestIDKey{}, id). Reading that in isolation, it is natural to picture context as holding something like an internal map that WithValue inserts into — a mental model that happens to give the right answer for that one example, but is not how context is actually implemented.',
        'Go\'s own standard library source shows the real structure directly. Each call to WithValue constructs a distinct valueCtx value — a struct holding exactly ONE key, ONE val, and an embedded reference to its own parent Context — not a shared map of every value attached so far. Ten calls to WithValue produce ten separate, nested valueCtx nodes, each one wrapping the context returned by the previous call.',
        'Value() lookup reflects this structure directly. The standard library\'s own valueCtx.Value method is short and exact: "if c.key == key { return c.val }; return value(c.Context, key)" — check THIS node\'s own single key; if it doesn\'t match, delegate to the parent and repeat. A lookup for a key attached early in a long WithValue chain has to walk past every node added AFTER it before finding a match.',
      ]
    },
    {
      heading: 'Why this shape matters — and when it actually matters',
      points: [
        'This means ctx.Value(key) is not a constant-time map lookup — its cost is proportional to how deep the requested key sits in the chain of nested WithValue calls, in the worst case walking all the way to the root context before concluding a key is absent. For the main page\'s own use case — a small, fixed handful of request-scoped values like a trace ID or auth token — this cost is negligible; the chain never gets deep enough to matter in practice.',
        'The risk this subtopic describes is specific to code that attaches MANY values via repeated WithValue calls — for instance, calling context.WithValue inside a loop, or a middleware chain where each of a dozen or more layers adds its own value to the same request\'s context. Each such call adds another node to walk through on every SUBSEQUENT Value() lookup for any key, including keys that were attached early and are looked up frequently downstream.',
        'This is precisely why the main page\'s own advice — "store only request-scoped data: trace IDs, auth tokens, request IDs. Never use it for optional function parameters" — is not just about avoiding hidden dependencies (its stated reason) but also implicitly keeps WithValue chains short by discouraging the kind of many-small-values usage pattern that would make this lookup cost noticeable. A context used as a general-purpose parameter bag, attaching a new value at every layer, is exactly the anti-pattern that turns this theoretical mechanic into a real, measurable cost.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One value: a single extra node, negligible lookup cost',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
)

type requestIDKey struct{}

func main() {
    ctx := context.Background()          // the root node
    ctx = context.WithValue(ctx, requestIDKey{}, "abc-123")
    // ctx is now ONE valueCtx node wrapping Background() -- a
    // lookup for requestIDKey{} checks exactly this one node and
    // matches immediately. This is the shape of the main page's
    // own WithValue example -- one value, one extra node, no
    // meaningful lookup cost either way.

    id, _ := ctx.Value(requestIDKey{}).(string)
    fmt.Println(id) // abc-123
}`,
    },
    {
      label: 'Many values via repeated WithValue: a real chain to walk',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
)

// Ten DISTINCT key types -- deliberately many, to make the chain
// depth this subtopic describes concrete and visible.
type (
    key1  struct{}
    key2  struct{}
    key3  struct{}
    key4  struct{}
    key5  struct{}
    key6  struct{}
    key7  struct{}
    key8  struct{}
    key9  struct{}
    key10 struct{}
)

func main() {
    ctx := context.Background()
    // Each call below wraps the PREVIOUS ctx in a new, single-key
    // valueCtx node -- this is a chain of 10 nested nodes by the
    // end, not one context holding 10 keys in a shared map.
    ctx = context.WithValue(ctx, key1{}, "v1")
    ctx = context.WithValue(ctx, key2{}, "v2")
    ctx = context.WithValue(ctx, key3{}, "v3")
    ctx = context.WithValue(ctx, key4{}, "v4")
    ctx = context.WithValue(ctx, key5{}, "v5")
    ctx = context.WithValue(ctx, key6{}, "v6")
    ctx = context.WithValue(ctx, key7{}, "v7")
    ctx = context.WithValue(ctx, key8{}, "v8")
    ctx = context.WithValue(ctx, key9{}, "v9")
    ctx = context.WithValue(ctx, key10{}, "v10")

    // key1{} was attached FIRST -- looking it up now must walk past
    // all 9 more-recently-added nodes (key10 down to key2) before
    // reaching the node holding key1, per valueCtx.Value's own
    // check-self-then-delegate-to-parent implementation.
    v, _ := ctx.Value(key1{}).(string)
    fmt.Println(v) // v1 -- correct, but reached via 10 checks deep,
                     // not a single constant-time lookup.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s HTTP middleware stack has grown to 15 layers over several years, and each layer calls context.WithValue to attach its own piece of data (a trace span, a feature-flag snapshot, a tenant ID, an auth claim, and so on) to the request context, deriving each new context from the one the previous layer produced. A performance review flags ctx.Value() lookups as a measurable, non-trivial cost in CPU profiles for the service\'s hottest request path. Using this subtopic\'s theory, explain why this specific pattern — as opposed to the main page\'s own single-value WithValue example — produces a real, measurable cost, and describe the general shape of a fix.',
    hint: 'How many valueCtx nodes does 15 sequential WithValue calls actually create, per this subtopic\'s theory? For a value attached by an EARLY middleware layer (say, layer 2 of 15) but read frequently by code running near the END of the request, how many nodes does each Value() call have to walk through?',
    solution: 'Fifteen sequential WithValue calls create a chain of fifteen nested, single-key valueCtx nodes — not one context holding fifteen keys in a shared, constant-time-lookup map, per this subtopic\'s theory and second code example. For a value attached early (layer 2) but read frequently by code running near the end of the request (after all fifteen layers have run), every single Value() call for that key has to walk through up to thirteen more-recently-added nodes (from layer 15 down to layer 3) before reaching the layer-2 node that actually holds it — and this repeats on EVERY lookup, for every request, which is exactly the kind of repeated, non-trivial cost a CPU profile on a hot request path would surface. This is fundamentally different from the main page\'s own single-value example, where the chain never gets deep enough for the linear-walk cost to be measurable at all. The general shape of a fix is to stop treating context as a general-purpose accumulator for every middleware layer\'s own data and instead consolidate frequently-read values into a SINGLE struct attached via ONE WithValue call early in the chain (e.g., a RequestMetadata struct holding the trace span, feature flags, tenant ID, and auth claim together, attached once) — this keeps the number of actual valueCtx nodes small regardless of how many logical pieces of data are carried, since fetching the whole struct via one Value() call and then accessing its fields directly sidesteps the chain-walking cost entirely for everything bundled inside it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'context.WithValue attaches a new entry to a shared, map-like structure inside the context, similar to setting a key on a dictionary — so ctx.Value(key) is a roughly constant-time lookup regardless of how many WithValue calls preceded it in the chain.',
      reality: 'This subtopic\'s theory and second code example show the actual implementation, taken directly from the Go standard library source, is fundamentally different: each WithValue call creates a brand-new, single-key valueCtx node wrapping its parent — there is no shared map at all. Value() lookup is a linear walk checking one key per node, so its cost genuinely scales with how many WithValue calls precede the requested key in the chain.'
    },
    {
      thought: 'The main page\'s own advice to "store only request-scoped data: trace IDs, auth tokens, request IDs" in context values is purely about avoiding hidden dependencies and making code harder to test — it has nothing to do with any performance characteristic of context itself.',
      reality: 'This subtopic\'s theory shows that same restraint also happens to keep WithValue chains short as a side effect, which matters for the linear-lookup-cost mechanic this subtopic describes — a codebase that violated that advice by attaching many small values through many separate WithValue calls (the middleware-chain anti-pattern in this subtopic\'s exercise) would incur a real, measurable lookup cost that disciplined, minimal context usage naturally avoids.'
    },
    {
      thought: 'The cost of a long WithValue chain is primarily about memory usage — each additional node allocates a small amount of extra memory, and that allocation overhead is the main thing to worry about with deeply chained contexts.',
      reality: 'This subtopic\'s theory and exercise focus on a different, often more significant cost: the LOOKUP time for ctx.Value() calls, which scales with chain depth on every single call, not just once at allocation time. A context read frequently (as in a hot request path) pays this linear-walk cost repeatedly, on every read, which can be a more significant concern in practice than the one-time, typically small memory overhead of the extra node allocations themselves.'
    }
  ];
}
