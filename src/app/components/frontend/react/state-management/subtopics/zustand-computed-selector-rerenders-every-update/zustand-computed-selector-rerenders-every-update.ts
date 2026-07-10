import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-zustand-computed-selector-rerenders-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './zustand-computed-selector-rerenders-every-update.html',
  styleUrl: './zustand-computed-selector-rerenders-every-update.scss',
})
export class ZustandComputedSelectorRerendersEveryUpdateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Own Hint Suggests a Selector That Isn\'t a Simple Field',
      points: [
        'The theory section says: "<code>useStore(s =&gt; s.count)</code> subscribes only to <code>count</code>. The component re-renders only when that slice changes." Every code-tab example selects a plain field or a stable action reference.',
        'The Challenge\'s own hints suggest something different: "compute <code>filteredProducts</code> directly in the selector: <code>useStore(s =&gt; s.products.filter(p =&gt; p.name.includes(s.search)))</code>." This subtopic tests whether a COMPUTED selector like this gets the same "re-renders only when that slice changes" guarantee as a plain field selector.',
      ],
    },
    {
      heading: 'Why a Computed Selector Breaks the Guarantee',
      points: [
        'Zustand decides whether to re-render a component by comparing the selector\'s RETURN VALUE across store updates using <code>Object.is</code> by default — not by inspecting which store fields the selector function happens to read.',
        'A plain field selector (<code>s =&gt; s.count</code>) returns the SAME primitive value if <code>count</code> hasn\'t changed, so <code>Object.is</code> correctly reports "unchanged." A computed selector like <code>s =&gt; s.products.filter(...)</code> calls <code>.filter()</code> fresh on every single store update, producing a BRAND NEW array reference every time — even if the filtered contents are byte-for-byte identical to last time.',
        'This means a component using this exact pattern re-renders on EVERY store change, including updates to completely unrelated fields (like <code>maxPrice</code> changing while <code>search</code> and <code>products</code> stay the same) — precisely the "subscribes to everything" problem Mistake #2 warns about with no-selector-at-all, just reintroduced through a different door.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "zustand-computed-selector-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "zustand": "^4.5.0"
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
  <head><title>Zustand computed selector re-renders</title></head>
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
      content: `import { create } from 'zustand';
import { useRef } from 'react';

const useStore = create(set => ({
  products: [
    { id: 1, name: 'React Handbook', price: 29 },
    { id: 2, name: 'TypeScript Course', price: 49 },
  ],
  search: '',
  maxPrice: 200,
  setMaxPrice: maxPrice => set({ maxPrice }),
}));

// The Challenge's own suggested pattern -- a COMPUTED selector.
function ProductList() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const filtered = useStore(s => s.products.filter(p => p.name.includes(s.search)));
  return (
    <div>
      <p>ProductList renders: {renderCount.current}</p>
      <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    </div>
  );
}

export default function App() {
  const maxPrice = useStore(s => s.maxPrice);
  const setMaxPrice = useStore(s => s.setMaxPrice);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <label>
        Max price (unrelated to the product list's search filter): {maxPrice}
        <input type="range" min={0} max={200} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />
      </label>
      <ProductList />
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        ProductList's selector only reads products and search -- never
        maxPrice. Drag the slider a few times. Does the render count
        stay frozen, or keep incrementing anyway?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Drag the max price slider a few times. ProductList\'s selector filters by search, never touching maxPrice — does its render count stay frozen, or keep incrementing?',
    hint: 'Zustand compares the selector\'s RETURN VALUE with Object.is — a fresh .filter() call produces a new array reference every time, regardless of what the selector function happened to read.',
    solution: `The render count increments on every single slider drag, even
though ProductList's selector never reads maxPrice at all. This looks
identical to Mistake #2's "subscribing to the entire store" problem,
but the actual mechanism here is different and easy to miss: the
selector DOES narrow what it reads (products and search only) -- the
problem is what it RETURNS.

.filter() allocates a new array every time it runs, so Zustand's
Object.is comparison sees "different reference" on every single store
update, regardless of which field actually changed or whether the
filtered results are identical. The selector re-runs on every store
change (Zustand always calls it to check), and its return value is
never equal to the last one by reference.

The practical lesson: "pass a selector" is necessary but not
sufficient. A selector that returns a freshly computed array or
object needs an explicit equality function -- useStore(selector,
shallow) from zustand/shallow for arrays/objects of primitives, or a
custom comparator -- to get the "only re-renders when the actual
result changes" behavior the main page's simple-field examples take
for granted.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'passing ANY selector function to useStore() — as opposed to calling useStore() with no arguments — guarantees a component only re-renders when the specific data it needs actually changes.',
      reality: 'a selector that computes a new array or object (like .filter() or .map()) returns a different reference on every store update regardless of content, so the component re-renders on every store change anyway, unless an explicit equality function is also supplied.',
    },
    {
      thought: 'this specific problem only affects Zustand — other selector-based state libraries do not have this same reference-identity trap.',
      reality: 'this is a general pattern across selector-based state tools (Redux\'s useSelector has the identical trap, which is why Reselect and memoized selectors exist) — any state library that compares a selector\'s return value by reference needs the selector to be either a stable field access or explicitly memoized.',
    },
    {
      thought: 'the fix for this problem is to stop using computed selectors and always select raw fields, doing the filtering/derivation inside the component body instead.',
      reality: 'that just moves the array allocation from the selector into the render function without fixing the re-render frequency — the actual fix is either a shallow-equality comparator (zustand/shallow) or memoizing the derived value the same way useMemo would, keyed on the fields it actually depends on.',
    },
  ];
}
