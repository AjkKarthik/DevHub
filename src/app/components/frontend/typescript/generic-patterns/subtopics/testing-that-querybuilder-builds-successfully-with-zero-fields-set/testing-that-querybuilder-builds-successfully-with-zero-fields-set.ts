import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-querybuilder-zero-fields-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-querybuilder-builds-successfully-with-zero-fields-set.html',
  styleUrl: './testing-that-querybuilder-builds-successfully-with-zero-fields-set.scss',
})
export class TestingThatQuerybuilderBuildsSuccessfullyWithZeroFieldsSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Different Builders on the Same Page',
      points: [
        'The theory section describes an aspirational "phantom type" builder — <code>class QueryBuilder&lt;TFields extends Partial&lt;Required&lt;Config&gt;&gt;&gt;</code> — and claims it "prevents calling build() before all required fields are set — a compile-time guarantee." No literal code for that exact class is ever shown on the page.',
        'The ACTUAL, literal, working code sample on the page is a different, simpler class in Common Mistake #3 — an accumulator builder that just grows its type via <code>T &amp; Record&lt;K, V&gt;</code> with each <code>.set()</code> call. This subtopic tests that concrete, shippable code: does <code>build()</code> actually require any fields to have been set first?',
      ],
    },
    {
      heading: 'Why the Accumulator Builder Has No Such Guarantee',
      points: [
        'The class signature is <code>class QueryBuilder&lt;T extends Record&lt;string, unknown&gt; = Record&lt;string, never&gt;&gt;</code> — note the DEFAULT type parameter, <code>Record&lt;string, never&gt;</code>, which is satisfied by an empty object with no required keys. <code>build(): T { return this.config; }</code> has no constraint requiring T to be non-empty.',
        'This means <code>new QueryBuilder().build()</code> is completely valid TypeScript — no fields were ever set, and it compiles and runs fine, returning <code>{}</code>. The type system genuinely does prevent accessing a field that was NEVER set (e.g. <code>q.limit</code> when <code>.set(\'limit\', ...)</code> was never called is a real compile error) — but it does not prevent calling <code>build()</code> itself at any point in the chain.',
        'The "required fields enforced before build()" guarantee described in the theory section belongs to a DIFFERENT, more elaborate pattern (the phantom-type <code>TFields extends Partial&lt;Required&lt;Config&gt;&gt;</code> approach) that is never actually implemented in code on this page — only described in prose. Readers copying the literal, working QueryBuilder sample do not get that guarantee for free.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>QueryBuilder with zero fields set</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own Common Mistake #3 "right" QueryBuilder, unchanged
class QueryBuilder<T extends Record<string, unknown> = Record<string, never>> {
  private config = {} as T;
  set<K extends string, V>(key: K, val: V): QueryBuilder<T & Record<K, V>> {
    return Object.assign(new QueryBuilder(), { config: { ...this.config, [key]: val } });
  }
  build(): T { return this.config; }
}

// The main page's own usage, with at least one field set
const q = new QueryBuilder().set('table', 'users').set('limit', 10).build();
console.log('with fields set:', q);
console.log('q.table =', q.table, ' q.limit =', q.limit);

// Does the theory's "prevents calling build() before all required
// fields are set" claim hold for THIS actual, literal code sample?
const empty = new QueryBuilder().build(); // zero .set() calls -- does this compile?
console.log('with ZERO fields set:', empty, JSON.stringify(empty));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Try accessing `empty.table` right after the `empty` example (a field that was never set on ANY QueryBuilder in this file). Does that compile? Compare it against `new QueryBuilder().build()` compiling cleanly with no error at all.',
    hint: 'The type system tracks exactly which fields exist on T -- accessing a field that was never added is a real compile error, but calling build() itself is never gated on T having any fields at all.',
    solution: `empty.table fails to compile: "Property 'table' does not exist on
type 'Record<string, never>'." -- confirming the type system DOES
correctly track which specific fields were set.

But new QueryBuilder().build() itself -- called with ZERO .set()
calls beforehand -- compiles and runs with no error whatsoever,
returning {} typed as Record<string, never>. There is no mechanism
in this actual code preventing build() from being called at any
point in the chain, immediately or after any number of .set() calls.

The distinction: this builder DOES correctly track which fields
exist (a real, useful guarantee for property access). It does NOT
implement "at least one field must be set before build() is
callable" -- that stronger guarantee is only described in the
theory section's separate phantom-type example, which has no actual
code on this page to test.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the QueryBuilder shown in Common Mistake #3\'s "right" code is the same "prevents calling build() before all required fields are set" builder described earlier in the theory section.',
      reality: 'they are two DIFFERENT examples — the theory section describes an aspirational phantom-type pattern with no literal code shown; the Common Mistake\'s actual, working code is a simpler accumulator builder that tracks fields but never gates `build()` on any of them being present.',
    },
    {
      thought: 'because QueryBuilder correctly rejects accessing a field that was never set (a real compile error), it must also reject calling build() before any fields are set.',
      reality: 'those are two separate guarantees — the first comes from T accurately tracking which keys exist; the second would require an additional constraint on build() itself (e.g. requiring T to satisfy some minimum shape), which this code never adds.',
    },
    {
      thought: 'a generic builder that "accumulates type information as methods are called" (as the page\'s own quiz describes it) necessarily also enforces a minimum set of required fields before allowing the final build step.',
      reality: 'type accumulation and required-field enforcement are independent features — a builder can do the former without the latter, exactly as this page\'s own literal QueryBuilder code demonstrates.',
    },
  ];
}
