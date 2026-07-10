import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-toast-container-outside-provider-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './toast-container-outside-provider-cant-access.html',
  styleUrl: './toast-container-outside-provider-cant-access.scss',
})
export class ToastContainerOutsideProviderCantAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Solution Makes a Specific, Easy-to-Miss Placement Choice',
      points: [
        'The Notification System challenge\'s own solution renders <code>&lt;ToastContainer /&gt;</code> INSIDE the Provider tree: <code>&lt;DispatchCtx.Provider&gt;&lt;StateCtx.Provider&gt;{children}&lt;ToastContainer /&gt;&lt;/StateCtx.Provider&gt;&lt;/DispatchCtx.Provider&gt;</code> — as a sibling to <code>children</code>, not as a sibling to the whole <code>NotificationProvider</code> component itself.',
        'The theory section separately says "Provider goes as high as needed, as low as possible" — a reasonable, common misreading of this is "the Provider should only wrap the app\'s actual content (<code>children</code>); infrastructure like a toast container belongs at the app root, outside the Provider." This subtopic tests what happens if you follow that misreading.',
      ],
    },
    {
      heading: 'Why ToastContainer Has to Be a Descendant of Its Own Provider',
      points: [
        '<code>ToastContainer</code> calls <code>useNotifications()</code>, which is <code>useContext(StateCtx)</code> under a throwing guard. <code>useContext</code> only ever finds a Provider by walking UP the component tree from where it\'s called — it has no way to reach a Provider that is a sibling, cousin, or otherwise not a direct ancestor in the render tree.',
        'If <code>&lt;ToastContainer /&gt;</code> is rendered at the app root, as a SIBLING of <code>&lt;NotificationProvider&gt;</code> rather than inside it, there is no <code>StateCtx.Provider</code> anywhere above it — <code>useNotifications()</code> throws exactly the same "must be used inside" error a component with a genuinely missing Provider would.',
        'This is precisely why the challenge\'s own solution places <code>ToastContainer</code> INSIDE the Provider component\'s own JSX, alongside <code>children</code> — not because "low as possible" means "outside," but because it means "no lower than the Provider that supplies its data," which for a component reading the context is: still inside it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "toast-container-placement-demo",
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
  <head><title>ToastContainer placement</title></head>
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
      content: `import { createContext, useContext, useState } from 'react';

const StateCtx = createContext(null);

// The main page's own throw-on-missing-Provider pattern.
function useNotifications() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

// CORRECT -- matches the challenge's own solution: ToastContainer
// is a child of the Provider, alongside {children}.
function NotificationProviderCorrect({ children }) {
  const [count] = useState(2);
  return (
    <StateCtx.Provider value={{ count }}>
      {children}
      <ToastContainer label="Correct placement (inside Provider)" />
    </StateCtx.Provider>
  );
}

function ToastContainer({ label }) {
  const { count } = useNotifications();
  return <p>{label}: {count} notifications</p>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <NotificationProviderCorrect>
        <p>App content goes here.</p>
      </NotificationProviderCorrect>

      {/* WRONG -- uncomment to compare: ToastContainer rendered as a
          SIBLING of the Provider, following a literal "as low as
          possible, outside the app content" misreading. */}
      {/* <ToastContainer label="Wrong placement (outside Provider)" /> */}
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The app currently renders correctly. Uncomment the second `<ToastContainer />` at the bottom, rendered as a sibling of `<NotificationProviderCorrect>` rather than inside it. What happens?',
    hint: 'useContext only ever finds a Provider by walking up the render tree from where it\'s called — a sibling in JSX is not an ancestor, no matter how nearby it looks in the source code.',
    solution: `With only the first ToastContainer (inside the Provider), the app
renders "Correct placement (inside Provider): 2 notifications" with
no errors.

Uncommenting the second ToastContainer -- rendered as a sibling of
NotificationProviderCorrect, not inside it -- throws:
"useNotifications must be used inside NotificationProvider" and
crashes the app. Despite being visually right next to the Provider in
the JSX source (both are direct children of App), there is no
StateCtx.Provider ANCESTOR above this second instance -- siblings in
JSX do not share context, only ancestors do.

The practical lesson: "Provider goes as low as possible" describes
how far DOWN into the app content you push the Provider boundary --
not a rule that infrastructure components should live outside it.
Any component that needs to READ the context (like a toast container,
a modal host, or a global loading overlay) must render somewhere
inside that Provider's own subtree, exactly as the original
challenge's solution places it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Provider goes as high as needed, as low as possible" means infrastructure components like a toast container should be rendered OUTSIDE the Provider, since they\'re not really part of the app\'s main content.',
      reality: 'any component that needs to READ the context — including infrastructure like a toast container — must be a descendant of the Provider that supplies it; "as low as possible" describes narrowing the Provider\'s wrapping scope within the app tree, not excluding components that depend on it.',
    },
    {
      thought: 'two components rendered as siblings in the same parent\'s JSX, close together in the source code, share access to the same context.',
      reality: '`useContext` only searches ANCESTORS in the render tree — sibling components have no special relationship to each other\'s context access, regardless of how close they appear in the JSX source.',
    },
    {
      thought: 'the challenge\'s solution placing `<ToastContainer />` inside the Provider, next to `{children}`, is an arbitrary implementation detail that could just as easily live at the app root instead.',
      reality: 'that placement is required, not arbitrary — moving `ToastContainer` outside the Provider\'s subtree breaks it immediately, since `useNotifications()` would then have no Provider ancestor to find.',
    },
  ];
}
