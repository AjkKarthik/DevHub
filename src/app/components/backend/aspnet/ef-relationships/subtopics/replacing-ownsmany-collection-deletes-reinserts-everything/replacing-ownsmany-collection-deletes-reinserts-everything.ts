import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ownsmany-replacement-gotcha-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './replacing-ownsmany-collection-deletes-reinserts-everything.html',
  styleUrl: './replacing-ownsmany-collection-deletes-reinserts-everything.scss',
})
export class ReplacingOwnsmanyCollectionDeletesReinsertsEverythingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own warning — "do not give owned entities an Id property — they are value objects" — has a direct, unstated consequence for how EF Core must handle updates to an OwnsMany collection',
      points: [
        'The main EF Relationships page\'s Owned Entities section is explicit: <code>OwnsMany</code> entities have "no identity outside their owner," and warns against giving them an <code>Id</code> property. What it does not spell out: WITHOUT an identity property, EF Core has NO WAY to match an existing owned-entity ROW in the database against a "new" owned-entity OBJECT in your updated in-memory collection — there is no key to compare. This has a direct, practical consequence for how you must MODIFY an <code>OwnsMany</code> collection.',
      ],
    },
    {
      heading: 'Mutating the EXISTING tracked collection (Add/Remove on the loaded list) lets EF Core diff by REFERENCE IDENTITY of the .NET objects themselves — but REPLACING the entire collection with a brand-new list breaks that reference identity entirely, forcing EF Core to delete every old row and insert every new one, even for logically identical entries',
      points: [
        'When you load a <code>Product</code> with its <code>Images</code> collection and call <code>product.Images.Add(newImage)</code> or <code>.Remove(existingImage)</code> on the SAME tracked <code>List&lt;Image&gt;</code> instance, EF Core can still determine what changed — it observes ADDITIONS and REMOVALS on the collection it is ALREADY tracking, using .NET object reference identity for entries that remain untouched (the SAME <code>Image</code> object instance that was loaded is still present, so EF Core knows THAT row is unchanged).',
        'But if you instead do <code>product.Images = newImageList;</code> — REPLACING the property with an entirely NEW <code>List&lt;Image&gt;</code> containing brand-new <code>Image</code> object instances (even if some of them represent LOGICALLY identical data to rows already in the database, like the exact same URL string) — EF Core has NO WAY to recognize any of the new objects as "the same" as any of the old ones, since owned entities have no key to compare by, and these are literally different .NET object references than whatever was originally loaded. The ONLY safe, correct behavior available to EF Core is to DELETE every previously-tracked owned row and INSERT every entry in the new collection from scratch — even entries that are, from a data perspective, completely unchanged.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The SAFE pattern — mutating the loaded, tracked collection preserves reference identity for unchanged entries',
      language: 'csharp',
      code: `// Main page's own OwnsMany example:
public class Product { public List<Image> Images { get; set; } = []; }
public class Image   { public string Url { get; set; } = ""; }

modelBuilder.Entity<Product>().OwnsMany(p => p.Images, img =>
    img.Property(x => x.Url).HasMaxLength(500));

// SAFE: load the product (and its owned Images), then mutate the
// SAME tracked List<Image> instance in place:
var product = await db.Products
    .Include(p => p.Images)     // loads the CURRENT owned rows —
    .FirstAsync(p => p.Id == id, ct);   // these SPECIFIC Image objects
                                          // are now tracked by reference

// Add a genuinely new image — appends to the SAME tracked list:
product.Images.Add(new Image { Url = "https://cdn.example.com/new.jpg" });

// Remove one specific image — EF Core recognizes the SPECIFIC object
// reference being removed from the tracked collection:
var toRemove = product.Images.First(i => i.Url.Contains("old-photo"));
product.Images.Remove(toRemove);

await db.SaveChangesAsync(ct);
// Generated SQL: ONE DELETE (for the removed image) + ONE INSERT (for
// the new image). Every OTHER image in the collection — untouched,
// still the SAME object reference EF Core originally loaded — gets
// NO SQL at all, since EF Core recognizes them as unchanged by
// reference identity within the tracked collection.`,
    },
    {
      label: 'The GOTCHA — replacing the entire collection deletes and reinserts EVERYTHING, even unchanged entries',
      language: 'csharp',
      code: `// A seemingly reasonable "sync the whole collection from a DTO"
// pattern — common when handling a PUT/PATCH request body that
// contains the FULL desired list of images:
public async Task UpdateProductImagesAsync(int id, List<string> newImageUrls, CancellationToken ct)
{
    var product = await db.Products
        .Include(p => p.Images)
        .FirstAsync(p => p.Id == id, ct);

    // BUG: this REPLACES the entire tracked collection with a BRAND
    // NEW List<Image>, built from scratch — even URLs that are
    // IDENTICAL to what's already in the database become NEW Image
    // object instances with NO relationship to the previously-tracked
    // ones:
    product.Images = newImageUrls.Select(url => new Image { Url = url }).ToList();

    await db.SaveChangesAsync(ct);
    // WHAT ACTUALLY HAPPENS: EF Core sees the ENTIRE previously-tracked
    // Images collection as "gone" (none of the new Image objects are
    // reference-identical to anything it was tracking), and the ENTIRE
    // new collection as "new" (same reason, in reverse). Generated SQL:
    //
    //   DELETE FROM Image WHERE ProductId = @id;   -- ALL old rows,
    //                                                -- including ones
    //                                                -- whose Url is
    //                                                -- IDENTICAL to a
    //                                                -- "new" one
    //   INSERT INTO Image (ProductId, Url) VALUES (@id, @url1);
    //   INSERT INTO Image (ProductId, Url) VALUES (@id, @url2);
    //   -- ... one INSERT per URL in 'newImageUrls', REGARDLESS of
    //   -- whether that exact URL already existed a moment ago
    //
    // For a product with 20 images where the update only genuinely
    // ADDS one new image, this generates 20 DELETEs + 21 INSERTs
    // instead of the single INSERT the "mutate in place" pattern from
    // the previous tab would have produced — wasteful, and for tables
    // with auto-incrementing surrogate keys or audit triggers on
    // insert/delete, potentially semantically incorrect too (e.g., an
    // audit log now shows 20 "deletions" and 21 "insertions" for what
    // was conceptually a single-image addition).

// THE FIX: diff the DTO against the currently loaded collection
// YOURSELF (by comparing Url values, since that's the only thing
// owned entities can be meaningfully compared by), and only Add()/
// Remove() the entries that GENUINELY changed — exactly the pattern
// from the previous tab:
public async Task UpdateProductImagesAsync_Fixed(int id, List<string> newImageUrls, CancellationToken ct)
{
    var product = await db.Products.Include(p => p.Images).FirstAsync(p => p.Id == id, ct);

    var toRemove = product.Images.Where(img => !newImageUrls.Contains(img.Url)).ToList();
    foreach (var img in toRemove) product.Images.Remove(img);

    var existingUrls = product.Images.Select(img => img.Url).ToHashSet();
    foreach (var url in newImageUrls.Where(u => !existingUrls.Contains(u)))
        product.Images.Add(new Image { Url = url });

    await db.SaveChangesAsync(ct);
    // NOW only the GENUINELY added/removed URLs generate SQL —
    // unchanged URLs remain untouched, since they were never removed
    // from (or re-added to) the tracked collection at all.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would catch a regression from the "fixed" diffing pattern back to the naive "replace the whole collection" pattern shown in this subtopic — one that specifically counts the number of DELETE and INSERT statements EF Core generates, rather than just checking the final state of the Images collection (which would look identical either way).',
    hint: 'Consider using options.LogTo(...) (as the sibling EF Core Basics topic\'s Performance Essentials section mentions) to capture the generated SQL during a test, then asserting on how many DELETE/INSERT statements appear for the Image table specifically.',
    solution: `A test that captures the generated SQL via LogTo and counts DELETE/
INSERT statements against the Image table directly proves whether the
diffing behavior is efficient or wasteful — the FINAL STATE of the
Images collection would look identical either way, so only inspecting
the generated SQL catches this regression:

[Fact]
public async Task UpdateProductImages_AddingOneImage_GeneratesOnlyOneInsert_NoUnnecessaryDeletes()
{
    var sqlLog = new List<string>();
    var connection = new SqliteConnection("Data Source=:memory:");
    connection.Open();
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseSqlite(connection)
        .LogTo(sql => sqlLog.Add(sql), LogLevel.Information)
        .Options;

    using (var setupDb = new AppDbContext(options))
    {
        setupDb.Database.EnsureCreated();
        setupDb.Products.Add(new Product
        {
            Id = 1,
            Images = [
                new Image { Url = "a.jpg" },
                new Image { Url = "b.jpg" },
            ]
        });
        await setupDb.SaveChangesAsync();
    }

    sqlLog.Clear();   // only capture SQL from the update itself

    using (var db = new AppDbContext(options))
    {
        await UpdateProductImagesAsync_Fixed(db, 1,
            ["a.jpg", "b.jpg", "c.jpg"],   // adding ONE new image
            default);
    }

    // Count how many INSERT/DELETE statements actually targeted the
    // Image table — the KEY assertion that distinguishes the
    // efficient diffing pattern from the naive replace-everything one:
    var insertCount = sqlLog.Count(s => s.Contains("INSERT INTO") && s.Contains("\\"Image\\""));
    var deleteCount = sqlLog.Count(s => s.Contains("DELETE FROM") && s.Contains("\\"Image\\""));

    // With the CORRECT diffing pattern: exactly ONE insert (for
    // "c.jpg"), ZERO deletes (a.jpg and b.jpg are untouched):
    Assert.Equal(1, insertCount);
    Assert.Equal(0, deleteCount);

    // If a future refactor reverted to 'product.Images = newList'
    // (the naive replace-everything pattern), this test would show
    // deleteCount == 2 and insertCount == 3 instead — directly
    // catching the regression to wasteful, whole-collection
    // replacement.
}

This test would PASS with the diffing-based fix and FAIL with the
naive replace-everything pattern, even though BOTH produce the exact
same FINAL Images collection ["a.jpg", "b.jpg", "c.jpg"] — proving that
inspecting the generated SQL, not just the final entity state, is
necessary to catch this specific class of inefficiency regression.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'replacing an OwnsMany collection property with a brand-new List<T> (product.Images = newList) is functionally equivalent to mutating the existing tracked collection (Add/Remove calls), just written more concisely.',
      reality: 'replacing the collection breaks .NET object reference identity entirely — since owned entities have no key to compare by, EF Core has no way to recognize any "new" entry as matching an "old" one, forcing it to DELETE every previously-tracked row and INSERT every entry in the new collection, even ones representing logically identical data.',
    },
    {
      thought: 'a test checking the final contents of a Product.Images collection after an update is sufficient to verify the update was implemented efficiently.',
      reality: 'both the efficient diffing pattern and the naive whole-collection-replacement pattern produce the exact same FINAL collection contents — only inspecting the actual generated SQL (via LogTo or a similar mechanism) reveals whether the update was implemented as a handful of targeted INSERT/DELETE statements or as a wasteful delete-everything-then-reinsert-everything operation.',
    },
    {
      thought: 'giving an owned entity type an Id property would solve the collection-replacement problem by letting EF Core match old and new entries by key.',
      reality: 'the main page explicitly warns against giving owned entities an Id property in the first place — they are value objects with no independent identity by design; if you find yourself needing to match entries by a stable key across updates, that is a signal the type should be a REGULAR entity with its own DbSet, not an owned type.',
    },
  ];
}
