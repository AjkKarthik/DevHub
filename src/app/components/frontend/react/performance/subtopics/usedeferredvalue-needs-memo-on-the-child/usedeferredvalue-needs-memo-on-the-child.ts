import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-usedeferredvalue-needs-memo-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './usedeferredvalue-needs-memo-on-the-child.html',
  styleUrl: './usedeferredvalue-needs-memo-on-the-child.scss',
})
export class UsedeferredvalueNeedsMemoOnTheChildSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Instruction Is Stated as a Suggestion, Not a Requirement',
      points: [
        'The theory section says: "Wrap a component with <code>memo</code> and pass the deferred value as a prop — it re-renders with the previous value until React has time to process the new one." The code tab shows <code>FilteredList</code> wrapped in <code>memo</code>, matter-of-factly, alongside <code>useDeferredValue</code>.',
        'Read casually, "wrap a component with memo AND pass the deferred value" sounds like two independent good practices being combined — not necessarily two components that fail together. This subtopic tests whether the <code>memo</code> wrapper is actually load-bearing: does removing it break <code>useDeferredValue</code>\'s entire benefit?',
      ],
    },
    {
      heading: 'Why useDeferredValue Does Nothing Without memo on the Consumer',
      points: [
        '<code>useDeferredValue(query)</code> gives you back a value that LAGS behind <code>query</code> during busy updates — but the component CALLING <code>useDeferredValue</code> (typically the parent, like <code>DeferredSearch</code>) still re-renders on every single keystroke, exactly as fast as <code>query</code> itself changes. The deferral only matters for whatever consumes the DEFERRED value as a prop, further down the tree.',
        'If that child is NOT wrapped in <code>memo</code>, it re-renders every time its parent re-renders — which is every keystroke — completely independent of whether its own <code>query</code> prop happens to be the lagging, deferred value or not. The child\'s render is driven by "my parent re-rendered," not by "my prop actually changed."',
        'Only a <code>memo</code>-wrapped child can actually SKIP a render when its deferred prop hasn\'t caught up yet — memo\'s shallow comparison is the mechanism that translates "the deferred value is still the old one" into "don\'t bother re-rendering this expensive child." Without memo, <code>useDeferredValue</code> still computes a correctly-lagging value, but nothing in the tree actually benefits from it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "usedeferredvalue-needs-memo-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start"
  }
}
`,
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html>
  <head><title>useDeferredValue needs memo</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    },
    {
      path: 'src/index.js',
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
`,
    },
    {
      path: 'src/App.js',
      content: `import { useState, useDeferredValue, memo, useRef } from 'react';

// The main page's OWN pattern -- memoized, receives the deferred value.
const MemoizedChild = memo(function MemoizedChild({ query }) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return <p>MemoizedChild (memo) renders: {renderCount.current} -- query: "{query}"</p>;
});

// The SAME component shape, deliberately NOT wrapped in memo.
function UnmemoizedChild({ query }) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return <p>UnmemoizedChild (no memo) renders: {renderCount.current} -- query: "{query}"</p>;
}

export default function App() {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type quickly..."
      />
      <MemoizedChild query={deferred} />
      <UnmemoizedChild query={deferred} />
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        BOTH children receive the exact same deferred value as their
        only prop. Type several characters quickly. Compare the two
        render counts -- does one climb slower than the other, or do
        both climb at the same rate?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type several characters quickly into the input. Both children receive the exact same deferred value. Compare the two render counts — does MemoizedChild\'s count climb slower than UnmemoizedChild\'s, or do they match?',
    hint: 'useDeferredValue only changes WHAT value is passed down — memo is what actually allows a component to skip a render when that value hasn\'t caught up yet.',
    solution: `MemoizedChild's render count climbs noticeably slower than
UnmemoizedChild's -- exactly the behavior the main page's pattern is
meant to produce. Because it's wrapped in memo, it skips re-rendering
on keystrokes where its query prop still holds the lagging, not-yet-
caught-up deferred value, only actually re-rendering once React has
processed the update and the deferred value moves forward.

UnmemoizedChild's render count climbs in lockstep with every single
keystroke, at exactly the same rate as the input itself updates --
despite receiving the IDENTICAL deferred, lagging value as its only
prop. Without memo, there's nothing to stop it from re-rendering just
because its parent (App) re-rendered, which happens on every
keystroke regardless of what useDeferredValue computed.

The practical lesson: useDeferredValue's performance benefit is not
self-contained -- it only manifests in whatever component is BOTH fed
the deferred value AND wrapped in memo. The main page's own
FilteredList example wraps both together as a single unit for exactly
this reason: dropping memo doesn't degrade the benefit, it eliminates
it completely, even though useDeferredValue itself keeps computing a
correctly-lagging value the whole time.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`useDeferredValue` reduces re-renders on its own — passing its return value to any component naturally makes that component render less often during rapid updates.',
      reality: '`useDeferredValue` only computes a lagging VALUE — whether a component receiving that value actually skips a render depends entirely on whether it\'s wrapped in `memo`; without it, the component re-renders on every parent re-render regardless of the value\'s own staleness.',
    },
    {
      thought: 'the `memo` wrapper on the main page\'s `FilteredList` example is a general best-practice habit shown alongside `useDeferredValue`, not something the pattern specifically depends on.',
      reality: 'it is a hard requirement for the pattern to have any effect at all — removing `memo` doesn\'t just reduce the benefit, it eliminates it entirely, since the child then re-renders at the same frequency as the parent regardless of the deferred prop.',
    },
    {
      thought: 'if a component consuming a deferred value is rendering slowly, wrapping the PARENT (the one calling useDeferredValue) in memo would help, similar to wrapping the child.',
      reality: 'the parent calling `useDeferredValue` re-renders on every keystroke by design — it owns the fast-updating state (`query`) directly, so memoizing it would have no effect; the optimization target is specifically the CHILD that receives the slower-moving deferred value as a prop.',
    },
  ];
}
