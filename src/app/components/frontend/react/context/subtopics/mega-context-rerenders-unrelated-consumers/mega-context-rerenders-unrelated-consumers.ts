import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mega-context-rerenders-unrelated-consumers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mega-context-rerenders-unrelated-consumers.html',
  styleUrl: './mega-context-rerenders-unrelated-consumers.scss',
})
export class MegaContextRerendersUnrelatedConsumersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #3 States the Consequence Without Showing It',
      points: [
        'Mistake #3 shows a single <code>AppContext</code> holding <code>{ user, theme, cart, notifications }</code>, with the comment "All app state in one context → every consumer re-renders on any change" — then fixes it by splitting into <code>AuthContext</code>, <code>ThemeContext</code>, <code>CartContext</code>.',
        'Quiz Q7 states the same thing directly: with a combined <code>{ user, cart, notifications }</code> context, "All three components re-render" when <code>notifications</code> changes. This subtopic makes that exact scenario concrete and visible with a render counter.',
      ],
    },
    {
      heading: 'Why One Object Means One All-or-Nothing Subscription',
      points: [
        '<code>useContext</code> subscribes a component to the ENTIRE value passed to the nearest matching Provider — not to individual fields within it. React has no way to know a component only "cares about" <code>theme</code> when it destructures <code>{ theme } = useContext(AppContext)</code>; from React\'s perspective, the whole object was read.',
        'When ANY field in the mega-context object changes, the Provider passes a new object reference (even if only <code>notifications</code> changed and <code>theme</code>/<code>user</code>/<code>cart</code> are identical values), so <code>Object.is</code> sees "different value" and every consumer — including ones that only ever destructure <code>theme</code> — re-renders.',
        'Splitting into separate contexts fixes this at the subscription level: a component calling <code>useContext(ThemeContext)</code> is only ever notified when <em>that specific Provider\'s</em> value changes, completely independent of what happens in <code>CartContext</code> or <code>AuthContext</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "mega-context-rerender-demo",
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
  <head><title>Mega-context and unrelated re-renders</title></head>
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
      content: `import { createContext, useContext, useState, useRef } from 'react';

// The main page's own Mistake #3 shape -- one object, multiple concerns.
const AppContext = createContext(null);

function ThemeDisplay() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const { theme } = useContext(AppContext);
  return <p>ThemeDisplay renders: {renderCount.current} (theme: {theme})</p>;
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(0);

  // One shared object -- exactly the main page's Mistake #3 shape.
  const value = { theme, notifications };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={() => setNotifications(n => n + 1)}>
        Add notification (currently {notifications}) -- theme is untouched
      </button>
      <AppContext.Provider value={value}>
        <ThemeDisplay />
      </AppContext.Provider>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        ThemeDisplay only ever reads theme, never notifications. Click
        the button -- theme never changes. Does ThemeDisplay's render
        count stay frozen, or keep incrementing anyway?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Add notification" a few times. ThemeDisplay only destructures `theme` from the context — does its render count stay frozen, or does it increment on every click?',
    hint: 'useContext subscribes to the WHOLE value object passed to the Provider — React has no visibility into which fields a component actually destructures from it.',
    solution: `ThemeDisplay's render count increments on every single click, even
though theme itself never changes -- only notifications does. This
is Mistake #3's exact claim, made visible: "all consumers re-render"
really does include components that only read a completely unrelated
field.

The root cause is the single value = { theme, notifications } object
recreated on every App render (with a fresh notifications value). Even
though theme's VALUE is unchanged, the object's REFERENCE is new, and
useContext's Object.is check operates on that whole reference, not on
individual fields.

The practical lesson: destructuring only "theme" in ThemeDisplay's own
code is a purely cosmetic narrowing -- it doesn't tell React or the
context system anything. The only way to actually stop this
re-render is exactly what the main page's fix does: split into
separate ThemeContext and a context holding notifications, so
ThemeDisplay subscribes to a Provider that genuinely never changes
when notifications does.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'destructuring only the fields a component needs from `useContext(AppContext)` — like `const { theme } = useContext(AppContext)` — tells React to only re-render that component when `theme` specifically changes.',
      reality: 'React has no visibility into which fields get destructured after the fact — `useContext` subscribes to the whole value object, and any change to ANY field triggers a re-render of every consumer, regardless of what they actually read.',
    },
    {
      thought: 'a mega-context is only a real performance problem in large apps with many consumers — a small app with 2-3 consumers is unaffected by the pattern described in Mistake #3.',
      reality: 'the mechanism is identical regardless of app size — even with a single consumer, that consumer re-renders on every unrelated field change; the main page\'s "affects many consumers" framing is about the BLAST RADIUS of the problem, not a threshold below which it stops happening at all.',
    },
    {
      thought: 'wrapping the mega-context\'s value object in `useMemo` (with all fields as deps) would solve the unnecessary re-render problem, similar to other memoization fixes on this page.',
      reality: '`useMemo` would only help if the object\'s CONTENTS were unchanged across renders — but here `notifications` genuinely DOES change, so any dependency array that includes it forces a recompute (and thus a new reference) on every notification change, providing no protection at all for `theme`-only consumers.',
    },
  ];
}
