import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-useproductsearch-shares-localstorage-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './useproductsearch-shares-localstorage-across-instances.html',
  styleUrl: './useproductsearch-shares-localstorage-across-instances.scss',
})
export class UseproductsearchSharesLocalstorageAcrossInstancesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Hardcoded Key Inside a Composed, Reusable Hook',
      points: [
        'The "Composed: useProductSearch" example calls <code>useLocalStorage(\'lastSearch\', initialQuery)</code> — <code>\'lastSearch\'</code> is a literal string, hardcoded inside the hook\'s own body, not derived from any argument the caller provides.',
        '<code>useProductSearch</code> is presented as a normal, reusable custom hook — nothing about its signature suggests it can only safely be called once per page. This subtopic tests what happens when TWO different components on the same page each call <code>useProductSearch()</code> independently, the way any other custom hook is expected to be used.',
      ],
    },
    {
      heading: 'Why This Is Different From "Custom Hooks Don\'t Share State"',
      points: [
        '<code>useState</code>-backed values inside <code>useProductSearch</code> — <code>query</code>, <code>debouncedQuery</code> — ARE genuinely isolated per call site, exactly as expected for any custom hook built on React\'s own state primitives.',
        'But <code>window.localStorage</code> is not React state at all — it is a single, global, browser-wide key-value store shared by every piece of code running on the page, completely outside React\'s per-component isolation. <code>useLocalStorage(\'lastSearch\', ...)</code> reads and writes the SAME physical storage slot no matter which component, or how many components, call it.',
        'This means two SEPARATE <code>useProductSearch()</code> call sites — in two unrelated components — will silently read and overwrite each other\'s <code>savedQuery</code> value, because both ultimately point at the identical <code>localStorage</code> key <code>\'lastSearch\'</code>. Typing in one search box can make the OTHER component\'s "last search" value change, with no prop, context, or explicit wiring connecting them.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "useproductsearch-localstorage-demo",
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
  <head><title>useProductSearch and shared localStorage</title></head>
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
      content: `import { useState, useEffect, useCallback } from 'react';

// The main page's own useLocalStorage, unchanged.
function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = useCallback((value) => {
    setStored(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [stored, setValue];
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// The main page's own composed hook, unchanged -- 'lastSearch' is hardcoded.
function useProductSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [savedQuery, setSavedQuery] = useLocalStorage('lastSearch', initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { if (debouncedQuery) setSavedQuery(debouncedQuery); }, [debouncedQuery, setSavedQuery]);

  return { query, setQuery, debouncedQuery, savedQuery };
}

function SearchWidget({ label }) {
  const { query, setQuery, savedQuery } = useProductSearch();
  return (
    <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 8 }}>
      <label>{label}: <input value={query} onChange={e => setQuery(e.target.value)} /></label>
      <p>This widget's savedQuery: "{savedQuery}"</p>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <SearchWidget label="Header search" />
      <SearchWidget label="Sidebar product filter" />
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        These are two SEPARATE, unrelated components, each calling
        useProductSearch() independently, with no shared props or
        context. Type into "Header search", wait a second, then check
        "Sidebar product filter"'s savedQuery. Does it stay unrelated,
        or pick up what you typed in the other box?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type into the "Header search" input, wait about a second (past the 300ms debounce), then check the "Sidebar product filter" widget\'s savedQuery. Does it stay independent, or pick up what you typed in the other box?',
    hint: 'useLocalStorage(\'lastSearch\', ...) always reads and writes the SAME literal key, regardless of which component or hook call instance invokes it — localStorage has no concept of per-component isolation.',
    solution: `After the debounce delay, the "Sidebar product filter" widget's
savedQuery updates to show whatever you typed into "Header search" --
even though you never touched the sidebar widget, and the two
SearchWidget components share no props, context, or explicit
connection of any kind.

This happens because both useProductSearch() calls resolve to the
exact same useLocalStorage('lastSearch', ...) call underneath --
'lastSearch' is a hardcoded literal, not scoped per component
instance in any way. Both widgets are, in effect, reading and writing
the identical physical storage slot. The query and debouncedQuery
values ARE correctly isolated per widget (confirm this yourself --
typing in one input never changes the OTHER input's live text) -- it
is specifically savedQuery, routed through localStorage, that leaks
across instances.

The practical lesson: "custom hooks don't share state" is true for
state built on React's own primitives (useState, useReducer, useRef)
but does NOT extend to external, ambient storage a hook happens to
read and write, like localStorage, sessionStorage, or a global cache.
A hook meant to be reusable across multiple instances on the same
page needs its storage key to be parameterized (e.g. accept a
namespace/id argument) rather than hardcoded, exactly the way a
well-designed useLocalStorage(key, ...) call site should differ per
usage.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`useProductSearch` is a normal, reusable custom hook, so calling it from two different components on the same page produces two fully independent instances, the same as any other hook built on `useState`.',
      reality: 'its `savedQuery` field specifically is backed by a hardcoded `localStorage` key (`\'lastSearch\'`) shared by every call site — two components calling `useProductSearch()` independently end up reading and writing the SAME underlying storage slot for that one field.',
    },
    {
      thought: 'if two components sharing a hook\'s state were a real problem, ALL of the hook\'s returned values would show cross-contamination — query, debouncedQuery, and savedQuery should all behave the same way.',
      reality: 'only `savedQuery` leaks across instances, because it\'s specifically the field routed through the hardcoded `localStorage` key — `query` and `debouncedQuery` stay correctly isolated per component, since they\'re backed by ordinary `useState` and `useEffect` with no shared external storage involved.',
    },
    {
      thought: 'the fix for this kind of leak is to avoid `localStorage` inside custom hooks entirely, since any browser storage mechanism is inherently unsafe for reusable hooks.',
      reality: '`localStorage` is fine to use inside a reusable hook — the actual fix is parameterizing the STORAGE KEY (accepting a namespace/id argument, like the main page\'s own general-purpose `useLocalStorage(key, initialValue)` already supports) rather than hardcoding a single literal key inside a hook meant to be called from multiple places.',
    },
  ];
}
