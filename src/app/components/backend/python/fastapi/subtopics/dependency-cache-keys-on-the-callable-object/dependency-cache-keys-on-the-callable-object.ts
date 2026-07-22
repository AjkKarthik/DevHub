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
  templateUrl: './dependency-cache-keys-on-the-callable-object.html',
  styleUrl: './dependency-cache-keys-on-the-callable-object.scss'
})
export class DependencyCacheKeysOnTheCallableObjectSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The cache key is the callable object itself, not what it does',
      points: [
        'The main page\'s own theory says "if the same dependency function appears multiple times in a route (directly and transitively), FastAPI calls it only once per request and caches the result" — but stops short of what "the same dependency function" actually means to FastAPI\'s cache lookup. FastAPI\'s own docs describe the mechanism: "FastAPI will know to call that sub-dependency only once per request... it will save the returned value in a \'cache\' and pass it to all the \'dependants\' that need it in that specific request."',
        'FastAPI\'s own source (fastapi/dependencies/models.py) shows exactly what the cache key is built from: a Dependant\'s cache_key property returns (self.call, scopes_for_cache, self.computed_scope). self.call is the raw callable object passed to Depends() — meaning the cache dictionary is keyed by object identity/equality of that specific callable, not by its name, its source code, or what it returns.',
        'This has a direct, testable consequence: two separately-defined functions with byte-for-byte identical bodies (def get_db_a(): ... and def get_db_b(): ... with the exact same three lines) are two DIFFERENT objects to Python and therefore two different cache keys — FastAPI calls each one independently, even within the same request, even though a human reading the code would call them "the same dependency."',
      ]
    },
    {
      heading: 'The practical trap: only the literal same reference shares a cache slot',
      points: [
        'The main page\'s own pattern — DB = Annotated[dict, Depends(get_db)] used as a reusable type alias — works correctly specifically because every route parameter that uses DB is passing the exact same get_db function object, reused via the type alias. Every occurrence resolves to the identical cache_key, so FastAPI genuinely calls get_db() once no matter how many times DB appears across a route\'s own parameters and its dependency tree.',
        'The trap appears when a dependency is constructed dynamically per call site instead of reused as a single reference — e.g. Depends(functools.partial(get_settings, env="prod")) written separately in two different places. Each partial(...) call creates a brand-new object, even though both wrap the identical underlying function with identical arguments — partial objects use default (identity-based) equality, so the two partials are unequal to each other, and neither shares a cache slot with the other. FastAPI happily calls get_settings twice in that one request.',
        'The fix is always the same: construct the dependency callable ONCE (as a module-level function, or a single partial()/instance stored in a variable) and reuse that single reference everywhere it is needed — exactly the pattern the main page\'s own DB alias already follows, just without spelling out why it is required for the caching to actually kick in.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two identical-looking functions do NOT share a cache slot',
      language: 'typescript',
      code: `from fastapi import FastAPI, Depends
from typing import Annotated

app = FastAPI()
call_count = {"a": 0, "b": 0}

def get_request_id_a() -> str:
    call_count["a"] += 1
    return "req-123"

def get_request_id_b() -> str:
    # byte-for-byte identical body to get_request_id_a — but a
    # SEPARATE function object with a different cache_key
    call_count["b"] += 1
    return "req-123"

@app.get("/demo")
async def demo(
    id_a1: Annotated[str, Depends(get_request_id_a)],
    id_a2: Annotated[str, Depends(get_request_id_a)],   # same object as id_a1
    id_b1: Annotated[str, Depends(get_request_id_b)],
):
    return {"a_calls": call_count["a"], "b_calls": call_count["b"]}
    # a_calls == 1  (id_a1 and id_a2 share ONE cache slot — same object)
    # b_calls == 1  (only one usage of get_request_id_b in this route)
    # If a THIRD parameter also used get_request_id_a, a_calls would
    # STILL be 1 — but if it used a fresh functools.partial() wrapping
    # the same function, that partial would get its OWN cache slot.`,
    },
    {
      label: 'A functools.partial() built per call site defeats the cache',
      language: 'typescript',
      code: `from fastapi import FastAPI, Depends
from functools import partial
from typing import Annotated

app = FastAPI()

def get_settings(env: str) -> dict:
    print(f"loading settings for {env}")   # simulates an expensive lookup
    return {"env": env, "debug": env != "prod"}

async def get_current_user(
    # BUG: a new partial(...) object is created every time this
    # dependency function itself is defined/called — even though
    # both wrap the SAME underlying get_settings with the SAME args
    settings: dict = Depends(partial(get_settings, env="prod")),
):
    return {"user": "alice", "env": settings["env"]}

async def get_feature_flags(
    # A SECOND, separately-constructed partial(...) — identical
    # arguments, but NOT the same object as the one above, so it
    # gets its own cache_key and get_settings runs again
    settings: dict = Depends(partial(get_settings, env="prod")),
):
    return {"flags": [], "env": settings["env"]}

@app.get("/profile")
async def profile(
    user: dict = Depends(get_current_user),
    flags: dict = Depends(get_feature_flags),
):
    # "loading settings for prod" prints TWICE for this one request —
    # the two partial() objects are unequal, so neither cache lookup
    # hits the other, even though the effective call is identical.
    return {"user": user, "flags": flags}

# THE FIX: build the partial ONCE, reuse the reference everywhere.
prod_settings = partial(get_settings, env="prod")

async def get_current_user_fixed(settings: dict = Depends(prod_settings)):
    return {"user": "alice", "env": settings["env"]}

async def get_feature_flags_fixed(settings: dict = Depends(prod_settings)):
    return {"flags": [], "env": settings["env"]}
# Now both dependencies reference the SAME prod_settings object —
# "loading settings for prod" prints only ONCE per request.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A route has two dependencies, each independently defined as async def get_org(org_id: int = Path(...)) -> Org: return Depends(OrgLoader(cache_ttl=60))(org_id) — where OrgLoader is a class whose __init__ builds a small in-memory cache. Both dependency functions instantiate OrgLoader(cache_ttl=60) inside Depends() at the point they are declared. The developer expected FastAPI\'s own per-request dependency caching to mean the organization is only loaded once per request, but logging shows it loading twice. Explain why, using what this subtopic covers.',
    hint: 'What object does FastAPI\'s cache_key actually track — the class name, the constructor arguments, or the literal callable/instance reference passed to Depends()? Are the two OrgLoader(cache_ttl=60) calls in this example the same Python object, or two separately-constructed ones?',
    solution: 'The organization loads twice because each Depends(OrgLoader(cache_ttl=60)) call constructs a brand-new OrgLoader INSTANCE — even though both instances were built with the identical cache_ttl=60 argument, OrgLoader(cache_ttl=60) called twice produces two genuinely different Python objects in memory. FastAPI\'s dependency cache_key is built from (self.call, scopes, computed_scope), where self.call is that specific callable object passed to Depends() — since instances of a plain class use default (identity-based) equality unless OrgLoader defines its own __eq__/__hash__, the two separately-constructed instances are unequal to each other, so they land in different cache dictionary slots. FastAPI has no way to know they would behave identically — it only knows they are two different objects, so it calls each one independently, exactly the way it would call two genuinely unrelated dependencies. The fix mirrors the second code example\'s functools.partial fix: construct ONE OrgLoader(cache_ttl=60) instance at module level (or anywhere shared), store it in a variable, and pass that single shared reference to Depends() everywhere the dependency is needed — with a single shared instance, both usages resolve to the identical cache_key and FastAPI\'s per-request caching genuinely calls it once.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FastAPI\'s dependency caching works by recognizing when two dependency functions do the same thing (same logic, same arguments, same return value) and calling only one of them per request.',
      reality: 'This subtopic\'s theory and first code example show the cache key is built purely from the literal callable OBJECT passed to Depends() (via its cache_key property) — FastAPI has no awareness of what a function does internally; it only knows whether the exact same object reference was used more than once, regardless of how similar two different functions\' behavior actually is.'
    },
    {
      thought: 'Wrapping a dependency function in functools.partial() to bind default arguments is functionally the same as using Depends() on the plain function directly, as far as FastAPI\'s per-request caching is concerned.',
      reality: 'This subtopic\'s second code example shows a real, common trap — a NEW functools.partial() object is created wherever partial(...) is called, and two separately-constructed partial objects (even wrapping the identical function with identical arguments) do not share a cache slot, since partial objects use default identity-based equality. Only reusing the SAME constructed partial object across every usage restores the intended single-call-per-request caching.'
    },
    {
      thought: 'The main page\'s DB = Annotated[dict, Depends(get_db)] pattern works because Annotated type aliases have some special caching behavior of their own, distinct from how Depends() normally caches.',
      reality: 'This subtopic\'s theory shows the DB alias works for the exact same reason any reused dependency reference works — every place DB is used resolves to the identical get_db function object, so every usage shares the identical cache_key. Annotated itself adds no special caching logic; it is simply a convenient way to reuse the same Depends(get_db) call site\'s object everywhere the alias is applied.'
    }
  ];
}
