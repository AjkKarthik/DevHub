import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-plugin-registry-key-desync-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-pluginregistry-never-verifies-name-matches-its-key.html',
  styleUrl: './testing-that-pluginregistry-never-verifies-name-matches-its-key.scss',
})
export class TestingThatPluginregistryNeverVerifiesNameMatchesItsKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the Challenge\'s register() Actually Does at Runtime',
      points: [
        'The challenge\'s solution defines <code>register&lt;K extends keyof TMap & string&gt;(plugin: TMap[K]): this { this.plugins.set(plugin.name, plugin); return this; }</code>. The generic type parameter <code>K</code> exists purely at the TYPE level — the ACTUAL Map key used at runtime is whatever string <code>plugin.name</code> happens to hold, read off the object itself.',
        'The whole promise of the registry — "type-safe... no casts needed at the call site" — depends entirely on an assumption the code never actually checks: that the plugin object\'s own <code>name</code> property, at runtime, matches whatever key <code>K</code> was inferred as at compile time. For the two example plugins (<code>LoggerPlugin</code> with the literal type <code>name: \'logger\'</code>, <code>MetricsPlugin</code> with <code>name: \'metrics\'</code>), that assumption happens to hold because each plugin\'s <code>name</code> is narrowed to a single literal value matching its own key exactly.',
      ],
    },
    {
      heading: 'Where the Assumption Can Break',
      points: [
        'If a future plugin type in <code>TMap</code> ever has a <code>name</code> typed as a general <code>string</code> (not narrowed to a single literal matching its own key) — or if two plugin interfaces happen to be structurally compatible with each other — nothing in <code>register()</code>\'s type signature stops a plugin from being registered under a DIFFERENT key than the one its own <code>name</code> property actually holds at runtime.',
        'The practical consequence: <code>get(\'expectedKey\')</code> can return <code>undefined</code> (nothing was ever stored under that string) even though a call to <code>register()</code> that "should" have gone there succeeded and returned <code>this</code> with no error — because it was silently filed under a different key, one determined by the plugin\'s own <code>name</code> value, not by the type parameter the caller (or type inference) selected.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>PluginRegistry key/name desync</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The challenge's exact PluginRegistry solution
interface Plugin {
  name:    string;
  version: string;
  execute(input: unknown): unknown;
}

class PluginRegistry<TMap extends Record<string, Plugin>> {
  private plugins = new Map<string, Plugin>();

  register<K extends keyof TMap & string>(plugin: TMap[K]): this {
    this.plugins.set(plugin.name, plugin);   // <-- keys by plugin.name, not K
    return this;
  }

  get<K extends keyof TMap & string>(name: K): TMap[K] | undefined {
    return this.plugins.get(name) as TMap[K] | undefined;
  }
}

// ── Two plugin types whose 'name' is left as a general string,
// unlike the challenge's own LoggerPlugin/MetricsPlugin (which
// narrow 'name' to a single literal matching their own key) ────────────────
interface GenericPluginA extends Plugin { tag: 'A' }
interface GenericPluginB extends Plugin { tag: 'B' }
type MyPlugins = { pluginA: GenericPluginA; pluginB: GenericPluginB };

const registry = new PluginRegistry<MyPlugins>();

// A plugin object whose 'name' does NOT match the key it's registered under --
// nothing in register()'s type signature catches this, because 'name' is
// just 'string', not narrowed to the literal 'pluginA':
const misnamedPlugin: GenericPluginA = {
  name: 'pluginB',       // <-- mismatched with the intended key 'pluginA'
  tag: 'A',
  version: '1.0',
  execute: () => null,
};

registry.register<'pluginA'>(misnamedPlugin);   // type-checks fine, no error

console.log('get("pluginA"):', registry.get('pluginA'));   // undefined!
console.log('get("pluginB"):', registry.get('pluginB'));   // the plugin ended up HERE
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Run the playground above and read both console.log lines. Then change misnamedPlugin\'s `name` field to `\'pluginA\'` (matching the intended key) and re-run. Does the type signature of register() change in either case — and what does that tell you about what TypeScript is actually verifying?',
    hint: 'Check whether TypeScript reports any error difference between the mismatched and matching versions — the type signature of register() never inspects the runtime value of plugin.name at all.',
    solution: `With the mismatched name, get("pluginA") logs undefined and
get("pluginB") logs the plugin object — it was silently filed under
"pluginB" (its actual runtime name), not "pluginA" (the key the
caller specified via the type argument). No TypeScript error occurs
in either version — the type signature of register() is identical
whether name matches the key or not, because register<K>(plugin:
TMap[K]) only checks that the PLUGIN'S SHAPE is assignable to
TMap[K]; it has no way to inspect or constrain the actual STRING
VALUE inside plugin.name at the type level.

This confirms the registry's "no casts needed, fully type-safe"
promise depends on a convention (plugin.name always matches its own
intended key) that the challenge's own type design does not
enforce — it happens to hold for the two example plugins only
because their 'name' fields are narrowed to single literals that
happen to equal their keys, not because anything structurally
requires it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a generic method\'s type signature "looks type-safe" (uses generics, no `any`, returns a specific type), it must be verifying everything relevant at compile time.',
      reality: 'a generic type parameter like `K` in `register<K extends keyof TMap & string>(plugin: TMap[K])` only constrains the SHAPE of the argument — it cannot inspect or constrain the runtime VALUE of a specific string property inside that argument, like `plugin.name`.',
    },
    {
      thought: 'the PluginRegistry challenge\'s solution guarantees `get(key)` always returns the plugin that was intended for that key, since register() and get() share the same generic constraint.',
      reality: 'that guarantee only holds as an unenforced CONVENTION — the actual Map key used by register() is read from `plugin.name` at runtime, completely independent of whatever type parameter the type checker inferred at the call site.',
    },
    {
      thought: 'this kind of type-vs-runtime-value mismatch is purely theoretical and unlikely to occur with real plugin definitions.',
      reality: 'it specifically depends on whether every plugin type in TMap narrows its own `name` field to a single literal exactly matching its own key — a convention that is easy to accidentally violate as a codebase grows and plugin interfaces are refactored or copy-pasted.',
    },
  ];
}
