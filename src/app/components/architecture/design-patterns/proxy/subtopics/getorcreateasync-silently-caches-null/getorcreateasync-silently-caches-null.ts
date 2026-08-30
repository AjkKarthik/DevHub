import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Behavior the Main Page\'s Own Code Is Exposed To, Unmentioned',
    points: [
      'The main page\'s <code>CachingProductRepository.GetByIdAsync</code> caches whatever ' +
      '<code>inner.GetByIdAsync(id)</code> returns via <code>cache.GetOrCreateAsync(...)</code> — including ' +
      'when the product does not exist and the inner call returns <code>null</code>.',
      'Many developers assume <code>IMemoryCache.GetOrCreateAsync</code> quietly skips caching a null result ' +
      '(reasoning: "there is nothing useful to cache"). The real, documented behavior is the opposite: by ' +
      'default, whatever the factory delegate returns — including <code>null</code> — IS stored in the cache ' +
      'entry, and subsequent calls for the same key return that cached <code>null</code> without ever calling ' +
      'the factory again until the TTL expires.',
    ],
  },
  {
    heading: 'Where This Actually Bites',
    points: [
      'Querying a product ID that does not exist YET caches "not found" for the full TTL (5 minutes on the ' +
      'main page\'s own <code>Ttl</code> constant). If that product is created moments later — a plausible ' +
      'race in any system where reads and writes can interleave — every caller hitting ' +
      '<code>GetByIdAsync</code> for that ID keeps getting the stale cached <code>null</code> until the ' +
      'reservation expires, even though the product genuinely exists now.',
      'The main page\'s own mistake block ("Using a caching proxy without cache invalidation") tells readers ' +
      'to invalidate on WRITE — but a CREATE operation for a brand-new ID has no reason to know a stale ' +
      '"not found" entry might already exist for that same key, so the standard "invalidate on write" advice ' +
      'does not automatically cover this specific case unless it is called out explicitly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Trap',
    language: 'csharp',
    code: `// Using the main page's own CachingProductRepository, unmodified.
var repo = new CachingProductRepository(inner, cache);

// Product #999 does not exist yet.
var missing = await repo.GetByIdAsync(999); // inner.GetByIdAsync(999) -> null
Console.WriteLine(missing is null); // true — as expected

// ...moments later, product #999 is CREATED in the database by a
// separate write path that has no reason to know about this cache key...
await db.Products.AddAsync(new Product { Id = 999, Name = "New Widget" });
await db.SaveChangesAsync();

// The cache entry for "products:999" is still the null result from
// before — GetOrCreateAsync only re-invokes the factory once the TTL
// (5 minutes, per the main page's own Ttl constant) has actually elapsed.
var stillMissing = await repo.GetByIdAsync(999);
Console.WriteLine(stillMissing is null); // STILL true — stale negative cache,
                                           // even though the product now exists`,
  },
  {
    label: 'Two Legitimate Fixes',
    language: 'csharp',
    code: `// Fix 1: explicitly opt OUT of caching a null result, using the same
// entry.Dispose() technique the underlying library exposes for this.
public async Task<Product?> GetByIdAsync(int id) =>
    await cache.GetOrCreateAsync($"products:{id}", async entry =>
    {
        var product = await inner.GetByIdAsync(id);
        if (product is null)
        {
            entry.Dispose(); // tells the cache NOT to store this entry at all
            return null;
        }
        entry.AbsoluteExpirationRelativeToNow = Ttl;
        return product;
    });

// Fix 2: if negative caching IS intentional (a real, valid choice — it
// protects against repeated DB hits for a genuinely-missing ID), give
// "not found" its OWN, much shorter TTL than a real hit gets.
public async Task<Product?> GetByIdAsync(int id) =>
    await cache.GetOrCreateAsync($"products:{id}", async entry =>
    {
        var product = await inner.GetByIdAsync(id);
        entry.AbsoluteExpirationRelativeToNow =
            product is null ? TimeSpan.FromSeconds(10) : Ttl; // short TTL for misses
        return product;
    });`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Fix 2 above deliberately keeps caching <code>null</code> results, just with a much shorter TTL. Given ' +
    'the main page\'s own stated reason for using a caching proxy (avoiding repeated expensive DB calls), why ' +
    'might this be a BETTER choice than Fix 1 in a system that receives many requests for IDs that genuinely ' +
    'do not exist (e.g. bots probing sequential IDs)?',
  hint:
    'Think about what Fix 1 does on EVERY single request for a missing ID, versus what Fix 2 does after the ' +
    'first request for that same missing ID.',
  solution:
    'With Fix 1, every single request for a nonexistent ID hits the real database, every time — Fix 1 only ' +
    'solves the STALENESS problem, not the repeated-expensive-call problem the caching proxy exists to solve ' +
    'in the first place. With Fix 2, the first request for a missing ID still hits the database once, but ' +
    'every request in the following 10 seconds is served from the cache instead — genuinely protecting the ' +
    'database from a burst of requests probing IDs that do not exist, while keeping the staleness window short ' +
    'enough that a newly-created product becomes visible again within seconds rather than the full 5-minute ' +
    'TTL a real hit gets. Fix 2 is a deliberate trade-off (bounded staleness in exchange for real protection ' +
    'against a specific abuse pattern), not simply "more correct" than Fix 1 — which fix is better depends on ' +
    'which failure mode the system actually needs to guard against.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'IMemoryCache must skip caching null results by default — otherwise a "cache miss" and a "cached ' +
      'null" would look identical from the caller\'s perspective.',
    reality:
      'They DO look identical from the outside — <code>GetByIdAsync</code> returns <code>null</code> either ' +
      'way — which is exactly the point: <code>GetOrCreateAsync</code>\'s job is only to decide whether to ' +
      're-run the factory delegate or return the last stored result, and by default it treats ' +
      '<code>null</code> as a perfectly valid stored result like any other, worth reusing until the entry ' +
      'expires.',
  },
  {
    thought: 'This is a bug in .NET\'s caching library that should be fixed upstream.',
    reality:
      'It is documented, intentional behavior, not a defect — caching <code>null</code> ("negative caching") ' +
      'is a legitimate, widely-used technique specifically for protecting a backing store from repeated ' +
      'lookups of known-missing keys. The actual risk is developers ASSUMING the opposite default without ' +
      'checking, not the library\'s behavior itself being wrong.',
  },
];

@Component({
  selector: 'app-proxy-getorcreateasync-silently-caches-null',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './getorcreateasync-silently-caches-null.html',
  styleUrl: './getorcreateasync-silently-caches-null.scss',
})
export class GetorcreateasyncSilentlyCachesNullSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
