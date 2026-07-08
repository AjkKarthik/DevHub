import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-eventhandlers-wrongly-includes-online-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-eventhandlers-wrongly-includes-online.html',
  styleUrl: './testing-that-eventhandlers-wrongly-includes-online.scss',
})
export class TestingThatEventhandlersWronglyIncludesOnlineSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s EventHandlers Filter',
      points: [
        'The Key Remapping tab defines <code>type EventHandlers&lt;T&gt; = { [K in keyof T as K extends \`on${string}\` ? K : never]: T[K] }</code>, filtering "by key name — keep only keys starting with \'on\'." Its <code>Component</code> example only has genuine handler properties (<code>onClick</code>, <code>onHover</code>) among the "on"-prefixed keys, so the filter looks like it correctly identifies handlers.',
        'This subtopic tests what happens when a property\'s name coincidentally starts with "on" but is NOT a handler at all — like <code>online: boolean</code>. The filter checks the KEY NAME against the pattern <code>on${string}</code>; it never checks whether the VALUE is actually a function.',
      ],
    },
    {
      heading: 'Why "online" Matches the on${string} Pattern',
      points: [
        'The condition is <code>K extends \`on${string}\`</code> — a template literal type check purely on the key\'s STRING SHAPE. <code>"online"</code> literally decomposes as <code>"on" + "line"</code>, and <code>"line"</code> is a valid <code>string</code>, so <code>"online" extends \`on${string}\`</code> evaluates to <code>true</code> — the same as <code>"onClick"</code> or <code>"onHover"</code>.',
        'Nothing in <code>EventHandlers&lt;T&gt;</code> examines <code>T[K]</code> (the property\'s VALUE type) at all — it only ever looks at <code>K</code> (the key\'s NAME). A boolean, string, or number property that happens to start with "on" — <code>online</code>, <code>oneTime</code>, <code>onboarded</code> — passes the filter exactly as if it were a real event handler.',
        'The fix requires checking BOTH conditions together: <code>K extends \`on${string}\` ? (T[K] extends (...args: unknown[]) =&gt; unknown ? K : never) : never</code> — filtering by key name AND confirming the value is actually callable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>EventHandlers key-name-only filter</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own EventHandlers utility, unchanged
type EventHandlers<T> = {
  [K in keyof T as K extends \`on\${string}\` ? K : never]: T[K];
};

// The main page's own Component interface, PLUS one non-handler
// property whose name happens to start with "on" -- added for this test
interface Component {
  id: string;
  onClick: () => void;
  onHover: () => void;
  render: () => string;
  online: boolean; // NOT a handler -- just a boolean that starts with "on"
}

type Handlers = EventHandlers<Component>;
// The main page's original result (without "online") was
// { onClick: () => void; onHover: () => void }.
// With "online" added, is it now also including online: boolean?

// A helper that only compiles if its argument is assignable to keyof Handlers
function assertIsHandlerKey<K extends keyof Handlers>(key: K): K { return key; }

assertIsHandlerKey('onClick'); // compiles -- genuine handler
assertIsHandlerKey('onHover'); // compiles -- genuine handler

// assertIsHandlerKey('online');
// Uncomment the line above -- does it compile? "online" is a boolean,
// not a function, but its key name matches the on\${string} pattern.

console.log('If no build error appeared above, "online" WAS included in EventHandlers<Component>.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `assertIsHandlerKey(\'online\')`. Confirm it compiles. Then write a corrected `RealEventHandlers<T>` that checks the value is callable, not just that the key starts with "on".',
    hint: 'Nest a second conditional inside the key-remapping check: first confirm the key matches the pattern, then separately confirm T[K] is a function type.',
    solution: `assertIsHandlerKey('online') compiles with no error -- confirming
"online" was genuinely included in EventHandlers<Component>, even
though it is a plain boolean property, not a handler.

A corrected version:

type RealEventHandlers<T> = {
  [K in keyof T as K extends \`on\${string}\`
    ? T[K] extends (...args: unknown[]) => unknown
      ? K
      : never
    : never]: T[K];
};

This checks BOTH conditions: the key must start with "on" AND the
value must be callable. Applied to the same Component interface
(with online included), RealEventHandlers<Component> correctly
yields only { onClick: () => void; onHover: () => void } --
"online" is excluded because boolean does not extend a function
type, even though its key name matched the pattern.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s `EventHandlers<T>` filter, named for its purpose, actually verifies that each matched property holds a callable handler function.',
      reality: 'the filter only checks the KEY\'S NAME against the `on${string}` pattern — it never inspects `T[K]` (the value\'s type) at all, so any property whose name happens to start with "on" (`online`, `oneTime`, `onboarded`) is included regardless of its actual type.',
    },
    {
      thought: 'the main page\'s Component example, tested only with genuine handler properties among its "on"-prefixed keys, proves the filter is semantically correct, not just syntactically matching.',
      reality: 'the example never included a non-handler property with an "on"-prefixed name, so it never exercised this exact gap — a filter validated only against well-behaved inputs can hide a real gap for coincidentally-named ones.',
    },
    {
      thought: 'filtering "by key name" and filtering "by value type" are just two different implementation styles that produce the same practical result for a type like EventHandlers.',
      reality: 'they answer genuinely different questions — key-name filtering can never distinguish a handler-shaped property from an unrelated one that merely shares a naming convention, no matter how the pattern is written.',
    },
  ];
}
