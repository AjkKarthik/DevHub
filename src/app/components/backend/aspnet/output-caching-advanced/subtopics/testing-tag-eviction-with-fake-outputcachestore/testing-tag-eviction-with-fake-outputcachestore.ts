import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-tag-eviction-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-tag-eviction-with-fake-outputcachestore.html',
  styleUrl: './testing-tag-eviction-with-fake-outputcachestore.scss',
})
export class TestingTagEvictionWithFakeOutputcachestoreSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'IOutputCacheStore Is a Three-Method Interface — No Redis Required to Test It',
      points: [
        'The main page\'s own Common Mistake "Forgetting to tag entries before trying to evict" and its "Eviction" code tab both show EvictByTagAsync being called, but neither is ever shown under test. IOutputCacheStore has exactly three members — EvictByTagAsync(tag, ct), GetAsync(key, ct), and SetAsync(key, value, tags, validFor, ct) — small enough to fake in-memory with a plain dictionary, with no distributed cache, no Redis, and no real HTTP round trip needed to prove a POST handler evicts the RIGHT tag.',
        'Swap the real store for the fake one only inside a WebApplicationFactory\'s ConfigureTestServices — AddOutputCache() itself and the UseOutputCache() middleware registration stay completely untouched; only the single IOutputCacheStore service registration is replaced, which is enough to observe every eviction call the app makes during the test.',
      ],
    },
    {
      heading: 'Response Bodies Alone Don\'t Prove a Cache Hit — Count the Real Work Instead',
      points: [
        'A GET that returns identical JSON on two consecutive calls could mean "served from cache" or "hit the database twice and got the same rows" — the response body cannot tell them apart. The reliable technique is to make the underlying repository count its own calls (a simple Interlocked-incremented counter on a test double), then assert call count stays at 1 across repeated cached GETs, and only increments again AFTER the tag has actually been evicted.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'FakeOutputCacheStore — in-memory, tracks evicted tags',
      language: 'csharp',
      code: `public class FakeOutputCacheStore : IOutputCacheStore
{
    private readonly Dictionary<string, HashSet<string>> _tagsToKeys = new();
    private readonly Dictionary<string, byte[]> _entries = new();

    // Exposed so tests can assert exactly which tags were evicted, and how many times.
    public List<string> EvictedTags { get; } = new();

    public ValueTask EvictByTagAsync(string tag, CancellationToken ct)
    {
        EvictedTags.Add(tag);
        if (_tagsToKeys.TryGetValue(tag, out var keys))
        {
            foreach (var key in keys) _entries.Remove(key);
            keys.Clear();
        }
        return ValueTask.CompletedTask;
    }

    public ValueTask<byte[]?> GetAsync(string key, CancellationToken ct)
        => ValueTask.FromResult(_entries.TryGetValue(key, out var v) ? v : null);

    public ValueTask SetAsync(string key, byte[] value, string[]? tags, TimeSpan validFor, CancellationToken ct)
    {
        _entries[key] = value;
        foreach (var tag in tags ?? Array.Empty<string>())
        {
            if (!_tagsToKeys.TryGetValue(tag, out var keys))
                _tagsToKeys[tag] = keys = new HashSet<string>();
            keys.Add(key);
        }
        return ValueTask.CompletedTask;
    }
}`,
    },
    {
      label: 'Integration test — proves the right tag is evicted AND the cache is actually bypassed',
      language: 'csharp',
      code: `public class CategoryCacheEvictionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly FakeOutputCacheStore _fakeStore = new();
    private readonly WebApplicationFactory<Program> _factory;

    public CategoryCacheEvictionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<IOutputCacheStore>(_fakeStore);
                services.AddSingleton<ICategoryRepo, CountingCategoryRepo>();
            }));
    }

    [Fact]
    public async Task Post_Evicts_Categories_Tag_So_Next_Get_Refetches()
    {
        var client = _factory.CreateClient();
        var repo = (CountingCategoryRepo)_factory.Services.GetRequiredService<ICategoryRepo>();

        await client.GetAsync("/categories");   // cold — hits the repo once, gets cached
        await client.GetAsync("/categories");   // should be served from cache, not the repo
        Assert.Equal(1, repo.CallCount);

        await client.PostAsync("/categories",
            JsonContent.Create(new CreateCategoryRequest("Books")));

        // Proves the POST handler evicted the RIGHT tag, not just "some" tag.
        Assert.Contains("categories", _fakeStore.EvictedTags);

        await client.GetAsync("/categories");   // cache was evicted — must hit the repo again
        Assert.Equal(2, repo.CallCount);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "fixes" a typo by renaming the eviction tag from <code>"categories"</code> to <code>"category"</code> in the POST handler, but leaves <code>.CacheOutput(b =&gt; b.Tag("categories"))</code> unchanged on the GET endpoint. Using the test above, explain exactly which assertion fails first, and why the response bodies alone would never have caught this.',
    hint: 'Trace what <code>EvictByTagAsync("category")</code> actually does against a FakeOutputCacheStore whose <code>_tagsToKeys</code> dictionary only has an entry under <code>"categories"</code>.',
    solution: `Assert.Contains("categories", _fakeStore.EvictedTags) fails immediately —
the fake store recorded an eviction call for "category" (singular), not
"categories" (the tag actually attached when the GET response was cached).
That single assertion pinpoints the exact typo.

The deeper problem is what happens if that assertion were removed:
EvictByTagAsync("category") against this FakeOutputCacheStore is a
complete no-op, since _tagsToKeys has no entry under that key — the
cached /categories entry is never actually removed. The third GET would
still be served from the stale cache, repo.CallCount would stay at 1
instead of becoming 2, and the LAST assertion would fail too — just one
step later, with a vaguer "stale data" failure instead of a precise
tag-name mismatch.

Response bodies alone would show identical JSON for a cached vs.
freshly-fetched category list — the only way to prove eviction actually
happened is the technique used here: counting real backend calls through
a test double, exactly as this test does.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing tag-based eviction requires standing up a real distributed cache (Redis) since IOutputCacheStore is meant to be a pluggable, production-grade backend.',
      reality: 'IOutputCacheStore is a 3-method interface — a fake in-memory implementation, swapped in via <code>ConfigureTestServices</code>, is enough to prove an endpoint calls <code>EvictByTagAsync</code> with the correct tag, with no Redis or distributed infrastructure involved.',
    },
    {
      thought: 'replacing IOutputCacheStore for a test requires re-registering or reconfiguring AddOutputCache() itself.',
      reality: 'AddOutputCache() and UseOutputCache() stay completely untouched — only the single <code>IOutputCacheStore</code> service registration is overridden with <code>services.AddSingleton&lt;IOutputCacheStore&gt;(fakeStore)</code>, since the store is a separate, independently swappable dependency.',
    },
    {
      thought: 'asserting the GET response body is identical across two consecutive calls is proof the second one was served from cache.',
      reality: 'identical JSON only proves the DATA didn\'t change — it cannot distinguish "served from cache" from "hit the database twice and got the same rows." Proving a cache hit requires counting the real backend work (e.g. a repo call counter), which is what actually distinguishes the two.',
    },
  ];
}
