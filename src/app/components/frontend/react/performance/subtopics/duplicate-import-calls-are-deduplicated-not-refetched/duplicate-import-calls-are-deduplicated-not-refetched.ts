import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-duplicate-import-deduplicated-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './duplicate-import-calls-are-deduplicated-not-refetched.html',
  styleUrl: './duplicate-import-calls-are-deduplicated-not-refetched.scss',
})
export class DuplicateImportCallsAreDeduplicatedNotRefetchedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Preloading Adds a Second import() Call Nobody Reconciles',
      points: [
        'The theory section recommends: "call the import() function on hover to warm the cache before the user clicks. The promise resolves instantly on click since the module is already downloading." The code tab\'s <code>preload</code> function does exactly this: <code>import(\'./RichTextEditor\')</code> fires on hover.',
        'But <code>React.lazy(() =&gt; import(\'./RichTextEditor\'))</code> ALSO calls <code>import(\'./RichTextEditor\')</code> internally, separately, the moment the lazy component actually renders. That is now TWO textually-separate calls to <code>import()</code> with the identical module specifier. This subtopic tests whether that causes the module to be fetched and evaluated twice.',
      ],
    },
    {
      heading: 'Why the Module System Itself Prevents a Second Fetch',
      points: [
        'Dynamic <code>import()</code> is a JavaScript language feature, not something React or a specific bundler invents — the underlying module loader (the browser\'s native ES module loader, or webpack/CRA\'s dev-server equivalent) maintains its OWN cache keyed by resolved module specifier, completely independent of React.',
        'Calling <code>import(\'./RichTextEditor\')</code> a second time with the exact same specifier does not trigger a new network request or a second module evaluation — the loader recognizes the specifier is already being fetched (or already fetched) and returns the SAME promise (or a promise that resolves from the same cached module record).',
        'This means the preload-on-hover pattern is doing exactly what it claims — priming a cache that <code>React.lazy</code>\'s own later <code>import()</code> call will transparently reuse — without any special coordination between the two call sites, and without downloading or evaluating the module\'s top-level code twice.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "duplicate-import-dedup-demo",
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
  <head><title>Duplicate dynamic import() calls</title></head>
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
      path: 'src/HeavyModule.js',
      content: `// Top-level code here runs exactly once, no matter how many
// times import('./HeavyModule') is called with this same specifier.
console.log('HeavyModule top-level code evaluated (should log ONCE)');

let moduleEvalCount = (globalThis.__heavyModuleEvalCount =
  (globalThis.__heavyModuleEvalCount || 0) + 1);
console.log('HeavyModule eval count so far:', moduleEvalCount);

export default function HeavyModule() {
  return <p>HeavyModule loaded (eval count: {moduleEvalCount})</p>;
}
`,
    },
    {
      path: 'src/App.js',
      content: `import { lazy, Suspense, useState } from 'react';

// React.lazy's OWN internal import() call -- fires when this
// component actually renders.
const LazyHeavyModule = lazy(() => import('./HeavyModule'));

export default function App() {
  const [preloaded, setPreloaded] = useState(false);
  const [showLazy, setShowLazy] = useState(false);

  const handlePreload = () => {
    // A SEPARATE, textually distinct import() call, same specifier.
    import('./HeavyModule');
    setPreloaded(true);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onMouseEnter={handlePreload} disabled={preloaded}>
        {preloaded ? 'Preloaded (hover fired)' : 'Hover to preload'}
      </button>
      <button onClick={() => setShowLazy(true)} style={{ marginLeft: 8 }}>
        Show the lazy component
      </button>

      {showLazy && (
        <Suspense fallback={<p>Loading...</p>}>
          <LazyHeavyModule />
        </Suspense>
      )}

      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Hover the first button (triggers a separate import() call),
        THEN click "Show the lazy component" (triggers React.lazy's
        own import() call to the same file). Open the console --
        does "HeavyModule top-level code evaluated" log once or twice?
        What eval count does the rendered component show?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Hover the "Hover to preload" button, then click "Show the lazy component". Open the console — does "HeavyModule top-level code evaluated" log once or twice? What eval count number does the rendered text show?',
    hint: 'The module loader caches by resolved specifier — a second import() call to the exact same path reuses the in-flight or already-resolved module record instead of fetching and evaluating it again.',
    solution: `"HeavyModule top-level code evaluated" logs exactly ONCE in the
console, no matter how much time passes between hovering (the
preload's import() call) and clicking (React.lazy's own import()
call to the identical specifier). The rendered component shows "eval
count: 1".

This confirms the module system's own caching handles this
automatically: the second import('./HeavyModule') call -- fired by
React.lazy when the component actually renders -- resolves from the
same module record the preload's import() call already created,
rather than triggering a second network fetch and a second execution
of the module's top-level code.

The practical lesson: preloading via a standalone import() call and
letting React.lazy make its own separate import() call to the same
specifier is not a redundant, wasteful pattern -- it's exactly how
the technique is SUPPOSED to work. You don't need to share a single
import() promise between the preload trigger and the lazy() call, or
coordinate them in any way; the module loader's built-in
specifier-based cache does that transparently, for free.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'preloading a lazy component via a separate `import(\'./X\')` call on hover, while `React.lazy(() => import(\'./X\'))` makes its own independent import() call later, causes the module to be downloaded and evaluated twice — once for the preload, once for the real render.',
      reality: 'the module loader caches by resolved specifier, independent of React entirely — a second `import()` call to the same path reuses the existing module record, so the module\'s top-level code runs exactly once regardless of how many places call `import()` on it.',
    },
    {
      thought: 'to safely preload a lazy component, you need to store the promise from the preload\'s import() call and somehow pass it to React.lazy, so both call sites share the exact same request.',
      reality: 'no coordination is needed — React.lazy can make its own completely independent `import()` call with no knowledge of the preload, and the module loader\'s own caching ensures it resolves from the already-fetched module rather than fetching again.',
    },
    {
      thought: 'this deduplication behavior is something React.lazy specifically implements to avoid double-fetching preloaded modules.',
      reality: 'this has nothing to do with React — it is a fundamental property of how ES module loaders (and bundler dev-server equivalents like webpack\'s) work for ANY `import()` call, whether made through React.lazy, a manual preload, or any other code path.',
    },
  ];
}
