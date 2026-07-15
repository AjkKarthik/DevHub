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
  templateUrl: './mixed-type-mutations-need-markmodified-to-persist.html',
  styleUrl: './mixed-type-mutations-need-markmodified-to-persist.scss'
})
export class MixedTypeMutationsNeedMarkmodifiedToPersistSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory names Mixed as one of the available field types ("String, Number, Boolean, Date, ObjectId, Mixed, Buffer") without further comment — worth knowing Mixed behaves fundamentally differently from every other type on that list when it comes to Mongoose noticing a change',
      points: [
        'Mongoose\'s change-tracking (which determines exactly what gets sent to MongoDB on .save()) works by intercepting assignments through Mongoose-defined SETTERS — every typed schema field (String, Number, a properly-typed nested schema, etc.) has Mongoose watching for direct assignment (doc.name = "New Name") and automatically marks that path as modified.',
        'A field typed Schema.Types.Mixed is explicitly schema-LESS — Mongoose has no defined shape for it, and therefore no setter watching for deep, in-place mutation of its contents. Mongoose\'s own documentation states this directly: "Since Mixed is a schema-less type, you can change the value to anything else you like, but Mongoose loses the ability to auto detect and save those changes."',
        'Concretely: doc.mixedField = { newKey: "value" } (a full REASSIGNMENT of the whole field) IS detected normally, because that\'s a direct assignment Mongoose\'s setter does see. But doc.mixedField.someKey = "newValue" (mutating a property INSIDE the existing object, without reassigning mixedField itself) is invisible to Mongoose — the object was mutated in place, but no assignment to mixedField itself ever happened for the setter to intercept.',
      ]
    },
    {
      heading: 'The documented fix, and where else this same limitation applies',
      points: [
        'Mongoose\'s own documentation gives the exact fix: call doc.markModified(path), passing the path to the Mixed field that was mutated, BEFORE calling .save(). This explicitly tells Mongoose "treat this path as changed," bypassing the need for the setter to have detected it automatically.',
        'This same underlying limitation — direct, in-place mutation not being detected — also applies more broadly to deeply nested plain-object or array mutations that don\'t go through a proper Mongoose-typed subdocument schema, not just fields explicitly declared Mixed. The safest general habit is either reassigning the whole field on every change (doc.field = { ...doc.field, newKey: "value" }, which DOES trigger the setter) or calling markModified() explicitly whenever an in-place mutation on a schema-less structure is unavoidable.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent no-op: mutating Mixed in place',
      language: 'typescript',
      code: `const configSchema = new Schema({
  name:     String,
  settings: Schema.Types.Mixed,  // arbitrary, schema-less shape
});
const Config = model('Config', configSchema);

const config = await Config.create({
  name: 'App Config',
  settings: { theme: 'dark', notifications: true },
});

// Mutating a property INSIDE settings, without reassigning settings
// itself — Mongoose's setter for "settings" is never triggered,
// because no assignment to "settings" happened, only to one of its
// nested properties.
config.settings.theme = 'light';
await config.save();

// Re-fetch and check — theme is STILL "dark" in the database.
// No error was thrown anywhere; the save() call appeared to succeed
// (because nothing else in the document actually changed either).
const reloaded = await Config.findById(config._id);
console.log(reloaded.settings.theme); // "dark" — the mutation never persisted`,
    },
    {
      label: 'Fixed: markModified(), or a full reassignment',
      language: 'typescript',
      code: `// Option 1 — explicit markModified(), per Mongoose's own docs
config.settings.theme = 'light';
config.markModified('settings'); // tells Mongoose this path changed
await config.save(); // NOW theme: "light" is correctly persisted

// Option 2 — full reassignment, which the setter DOES detect
// without needing markModified() at all:
config.settings = { ...config.settings, theme: 'light' };
await config.save(); // also correctly persists — a real assignment
                      // to "settings" itself triggers the setter.

// The same underlying rule applies to deep mutation of a plain
// nested object field (not explicitly Mixed) if the nesting isn't
// itself a properly Mongoose-typed subdocument schema — when in
// doubt, reassign the whole field or call markModified() explicitly
// rather than assuming a deep, in-place mutation will be noticed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a feature-flag system using a Mixed-typed flags field on a Config document. Their update endpoint does config.flags[flagName] = enabled; await config.save();. In manual testing with a single flag, everything appears to work — but a bug report later shows that toggling a SECOND flag, on a document that already has flags set, silently fails to persist while the FIRST flag toggle (on a brand-new document with no prior flags field) worked fine. Using Mongoose\'s documented Mixed-type change-tracking behavior, explain both outcomes.',
    hint: 'Was the FIRST flag toggle actually a mutation of an EXISTING flags object, or did it involve Mongoose creating/assigning the flags field for the first time? Does that distinction matter for whether the setter gets triggered?',
    solution: 'The key difference is what actually happened at the assignment level in each case, not something inherently different about "first" versus "second" flags. If the first toggle occurred on a brand-new document where flags didn\'t exist yet, config.flags[flagName] = enabled would have thrown a TypeError (cannot set property on undefined) unless something had already assigned config.flags = {} or similar first — meaning the working case likely involved an actual assignment TO flags at some point (even indirectly, e.g., via the document\'s default value being set through Mongoose\'s own default mechanism, which does correctly initialize and track the field). The SECOND flag toggle, on a document that already had a flags object from a PRIOR save, is a pure in-place mutation of an EXISTING Mixed object\'s property — config.flags[flagName] = enabled here never reassigns flags itself, so Mongoose\'s setter is never triggered, and the change is silently lost on save(), exactly matching Mongoose\'s own documented Mixed-type limitation. The fix is calling config.markModified(\'flags\') immediately after every in-place mutation of the flags object, regardless of whether it "happens to work" in a specific test case — relying on incidental assignment behavior (like a schema default happening to trigger the setter once) is not a reliable substitute for explicitly marking the path modified every time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Mongoose\'s .save() automatically detects and persists any change made to a document\'s fields, regardless of whether the field was reassigned or mutated in place.',
      reality: 'This subtopic\'s theory and first code example both show this is false specifically for Schema.Types.Mixed fields (and similar schema-less nested structures) — Mongoose\'s change-tracking relies on setters triggered by direct assignment, and an in-place mutation without reassignment is invisible to it.'
    },
    {
      thought: 'Since the main page lists Mixed as just one item in a list of available Mongoose field types (alongside String, Number, Date, etc.), it behaves the same way as those other types with respect to change detection.',
      reality: 'This subtopic\'s theory clarifies Mixed is fundamentally different — it is explicitly schema-less, so Mongoose has no defined setter watching for deep mutation of its contents, unlike properly-typed fields where direct assignment is reliably detected.'
    },
    {
      thought: 'Once markModified() has been called for a Mixed field on one save, Mongoose remembers this and will automatically detect future in-place mutations to that same field without needing markModified() called again.',
      reality: 'This subtopic\'s second code example and exercise both show the opposite — markModified() only affects the CURRENT pending save; every subsequent in-place mutation of a Mixed field needs its own explicit markModified() call (or a full reassignment) before the next .save(), with no persistent "now I\'m watching this" memory carried forward.'
    }
  ];
}
