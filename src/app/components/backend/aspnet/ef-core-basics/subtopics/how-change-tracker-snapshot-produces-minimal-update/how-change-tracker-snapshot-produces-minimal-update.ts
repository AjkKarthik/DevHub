import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-change-tracker-snapshot-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-change-tracker-snapshot-produces-minimal-update.html',
  styleUrl: './how-change-tracker-snapshot-produces-minimal-update.scss',
})
export class HowChangeTrackerSnapshotProducesMinimalUpdateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the FACTS — load-then-modify produces a minimal UPDATE, context.Update() marks everything Modified — without explaining WHY these two patterns behave so differently',
      points: [
        'The main EF Core Basics page says: "When you query entities without <code>AsNoTracking()</code>, EF Core takes a snapshot of their original values. Mutating properties sets the entity state to <code>Modified</code>. <code>SaveChangesAsync()</code> generates the minimal UPDATE SQL for only changed properties," and separately, "<code>context.Update(entity)</code> marks ALL scalar properties <code>Modified</code>." These are stated as two independent facts — the connection between them (WHY loading produces a minimal diff, and WHY <code>Update()</code> can\'t) is the actual mechanism worth understanding.',
      ],
    },
    {
      heading: 'A tracked entity has TWO value sets internally — CurrentValues and OriginalValues — and SaveChanges() compares them property-by-property; Update() has no OriginalValues to compare against because the entity was never loaded through THIS context, so it conservatively assumes every property changed',
      points: [
        'When <code>FindAsync()</code> or a tracked LINQ query loads an entity, EF Core\'s change tracker stores a snapshot called <code>OriginalValues</code> — a copy of every property\'s value AT THE MOMENT IT WAS LOADED. When you later mutate a property (<code>product.Price = 99.99m</code>), the entity\'s <code>CurrentValues</code> reflects the new value, but <code>OriginalValues</code> still holds what was loaded. <code>SaveChangesAsync()</code> compares <code>CurrentValues</code> against <code>OriginalValues</code> PROPERTY BY PROPERTY, and includes ONLY the properties where they differ in the generated UPDATE statement.',
        '<code>context.Update(entity)</code> is used specifically for a DETACHED entity — one that was never loaded through THIS <code>DbContext</code> instance (e.g., constructed directly from a request DTO, as the main page\'s own broken example shows). Since this entity has NO <code>OriginalValues</code> snapshot at all — it was never tracked before this moment — EF Core has NO BASIS for comparison. It cannot know whether <code>Name</code> "changed" from something, because it never saw what <code>Name</code> was before. The ONLY safe, conservative choice available is to mark EVERY scalar property as <code>Modified</code>, guaranteeing the UPDATE statement includes every column — which is exactly why partial updates via <code>Update()</code> silently overwrite fields the caller never intended to touch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing exactly what OriginalValues and CurrentValues look like for the main page\'s own load-then-modify example',
      language: 'csharp',
      code: `// The main page's own "right" UpdatePriceAsync pattern:
public async Task UpdatePriceAsync(int id, decimal newPrice, CancellationToken ct)
{
    var product = await db.Products.FindAsync([id], ct)
        ?? throw new KeyNotFoundException();
    // At THIS moment, EF Core's change tracker snapshots product's
    // CURRENT state as OriginalValues:
    //   OriginalValues: { Id = 5, Name = "Laptop", Price = 899.99, IsActive = true }

    product.Price = newPrice;   // say, newPrice = 999.99m
    // Now CurrentValues reflects the mutation:
    //   CurrentValues:  { Id = 5, Name = "Laptop", Price = 999.99, IsActive = true }
    // OriginalValues is UNCHANGED — still holds the value as loaded.

    await db.SaveChangesAsync(ct);
    // SaveChangesAsync compares CurrentValues to OriginalValues,
    // PROPERTY BY PROPERTY:
    //   Id:       899.99 == 899.99? no wait — Id: 5 == 5?        UNCHANGED
    //   Name:     "Laptop" == "Laptop"?                          UNCHANGED
    //   Price:    999.99 == 899.99?                               CHANGED  <-- only this one
    //   IsActive: true == true?                                  UNCHANGED
    //
    // Generated SQL includes ONLY the changed column:
    //   UPDATE Products SET Price = 999.99 WHERE Id = 5;
}

// Directly observable via the Entry API:
var entry = db.Entry(product);
Console.WriteLine(entry.Property(p => p.Price).OriginalValue);   // 899.99
Console.WriteLine(entry.Property(p => p.Price).CurrentValue);    // 999.99
Console.WriteLine(entry.Property(p => p.Price).IsModified);      // true
Console.WriteLine(entry.Property(p => p.Name).IsModified);       // false — untouched`,
    },
    {
      label: 'Why context.Update() on a NEVER-LOADED entity has literally no OriginalValues to compare against',
      language: 'csharp',
      code: `// The main page's own BROKEN example — a Product constructed
// directly from a partial DTO, never loaded through THIS context:
var dto = await req.ReadFromJsonAsync<UpdateProductDto>();  // { price: 99.99 }
var product = new Product { Id = id, Price = dto.Price };
// 'product' has NEVER been tracked by 'db' before this line. Its
// Name and Category properties are whatever the C# default is for
// their type (null, or empty string, depending on how Product is
// declared) — NOT the actual values currently in the database.

db.Update(product);
// db.Update() calls db.Attach(product) internally, THEN explicitly
// marks EVERY scalar property's state as Modified — because there is
// NO OriginalValues snapshot to compare CurrentValues against.
// EF Core has ONE piece of information: "here is an entity with SOME
// values." It has NO WAY to know whether 'product.Name' (currently
// null, or empty string) represents "the user wants to clear the
// name" or "the user never touched this field, and this is just an
// artifact of how the DTO happened to be constructed." The ONLY
// SAFE assumption without a snapshot is: everything might have
// changed, mark everything Modified.

await db.SaveChangesAsync(ct);
// Generated SQL includes EVERY column, unconditionally:
//   UPDATE Products SET Name = NULL, Price = 99.99, Category = ''
//   WHERE Id = 5;
// — silently WIPING the real Name and Category values that existed
// in the database, because 'product' never had a chance to snapshot
// them as OriginalValues in the first place.

// THE DIRECT FIX, restated with the underlying mechanism now explicit:
// load the entity through THIS context FIRST (giving it a genuine
// OriginalValues snapshot), THEN mutate only the field that changed —
// this is EXACTLY what makes load-then-modify safe, and Update() on a
// bare, never-loaded entity unsafe.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that context.Attach(entity) (used inside Update() internally) has no OriginalValues snapshot for a never-loaded entity, explain why the main page\'s own "Attach + selective property modification" pattern (context.Attach(product); context.Entry(product).Property(p => p.Price).IsModified = true;) is safe DESPITE using Attach on a potentially detached entity — what makes THIS pattern avoid the same "no snapshot" problem Update() has.',
    hint: 'Consider that this pattern does NOT rely on EF Core comparing CurrentValues to OriginalValues to DECIDE which properties changed — instead, the developer explicitly TELLS EF Core which single property to mark Modified. Does that sidestep the need for a snapshot-based comparison entirely?',
    solution: `The Attach + explicit IsModified pattern sidesteps the "no snapshot"
problem entirely by NOT RELYING on snapshot comparison at all — it
replaces the automatic diffing mechanism with an EXPLICIT, manual
declaration of exactly which property changed:

db.Attach(product);   // starts tracking, entity state = Unchanged,
                        // with OriginalValues initialized to WHATEVER
                        // 'product' currently holds (since there's no
                        // real "before" state to compare against for a
                        // detached entity, Attach() just uses the
                        // CURRENT values as the baseline)
db.Entry(product).Property(p => p.Price).IsModified = true;
                        // This EXPLICITLY tells EF Core: "regardless of
                        // what OriginalValues says, treat Price as
                        // changed" — bypassing the need for EF Core to
                        // FIGURE OUT what changed via comparison at all.
await db.SaveChangesAsync(ct);
// Generated SQL includes ONLY Price, because ONLY Price was
// EXPLICITLY marked Modified — Name and Category remain at their
// initial (Unchanged) state, regardless of what values 'product'
// happens to hold for them.

The key distinction: context.Update(entity) makes EF Core GUESS which
properties changed (and, lacking any real snapshot to compare against,
it conservatively guesses "all of them"). The Attach + explicit
IsModified pattern removes the guessing entirely — the DEVELOPER
directly states which property changed, using their own knowledge of
the actual business operation (e.g., "this is specifically a price
update, only touch Price"), rather than asking EF Core's automatic
change-detection machinery to infer it from a comparison that has no
valid baseline to work from in the first place.

This is why the Attach pattern is considered safe for partial updates
even on a genuinely detached entity — it doesn't need a real
OriginalValues snapshot, because it never asks EF Core to COMPARE
anything. It only asks EF Core to INCLUDE one specific, developer-named
property in the generated UPDATE statement.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'context.Update(entity) marks all properties as Modified because it is being overly cautious or poorly designed — a "smarter" implementation could figure out which properties actually changed.',
      reality: 'marking everything Modified is the ONLY correct behavior available given the information EF Core actually has — a never-loaded, detached entity has no OriginalValues snapshot to compare against, so there is no way to determine which properties genuinely changed versus which just happen to hold their default value.',
    },
    {
      thought: 'the "snapshot" EF Core takes when loading a tracked entity is a deep copy stored somewhere separate from the entity object itself, adding significant memory overhead for every tracked entity.',
      reality: 'while OriginalValues is genuinely additional state the change tracker maintains (which is exactly why AsNoTracking() saves memory by skipping it), the mechanism is specifically what enables minimal, precise UPDATE statements — understanding IT exists is what explains why AsNoTracking() has a real, measurable performance benefit at all.',
    },
    {
      thought: 'the Attach() + explicit IsModified pattern works by giving EF Core a way to reconstruct a real OriginalValues snapshot for a detached entity, similar to loading it fresh from the database.',
      reality: 'the Attach + explicit IsModified pattern does NOT reconstruct any real snapshot at all — it sidesteps the need for one entirely, by having the developer directly declare which property changed rather than asking EF Core to infer it through comparison.',
    },
  ];
}
