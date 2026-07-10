import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-queryby-getby-real-rtl-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './queryby-returns-null-getby-throws-real-rtl.html',
  styleUrl: './queryby-returns-null-getby-throws-real-rtl.scss',
})
export class QuerybyReturnsNullGetbyThrowsRealRtlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Claim Is Stated Confidently, But Only Ever Shown in Passing Test Snippets',
      points: [
        'Mistake #3 states plainly: "queryBy returns null if not found... getBy throws a descriptive error if not found." Every code tab uses these functions inside <code>it(...)</code> blocks, where a thrown error or a null value is just implicitly part of a passing/failing test — never something the reader actually SEES.',
        'This subtopic calls the REAL <code>@testing-library/react</code> package\'s <code>render</code>, <code>screen.getByRole</code>, and <code>screen.queryByRole</code> functions directly from a plain browser button click — no Jest, no Vitest, no test runner — and displays exactly what each one returns or throws.',
      ],
    },
    {
      heading: 'Why This Works Without Any Test Runner At All',
      points: [
        '<code>@testing-library/react</code>\'s <code>render()</code> and the query functions it returns (also exposed via <code>screen</code>) are ordinary JavaScript functions that operate on a real DOM — they mount your component into a container element and search it with <code>querySelector</code>-style logic under the hood. Nothing about them requires Jest, Vitest, or any specific test runner.',
        'This means the exact same functions your test files import can be called directly from a normal React event handler, in a normal browser, completely outside any testing framework — which is exactly what this subtopic does, to show you the real return values and real thrown error, not just describe them in prose.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "queryby-getby-real-rtl-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "@testing-library/react": "^14.2.1",
    "@testing-library/dom": "^9.3.4"
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
  <head><title>getByRole vs queryByRole — real RTL</title></head>
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
      content: `import { useState } from 'react';
import { render, screen } from '@testing-library/react';

// A simple component with ONE button, no "Nonexistent" button anywhere.
function SearchBox() {
  return <button>Search</button>;
}

export default function App() {
  const [output, setOutput] = useState('Click the button below to run the real queries.');

  function runQueries() {
    // render() mounts SearchBox into a real, detached DOM container --
    // this is the EXACT same function every RTL test file imports.
    const { unmount } = render(<SearchBox />);

    let getByResult;
    try {
      // Querying for a button that does NOT exist.
      screen.getByRole('button', { name: /nonexistent/i });
      getByResult = 'did not throw (unexpected)';
    } catch (err) {
      getByResult = 'THREW: ' + err.message.split('\\n')[0];
    }

    const queryByResult = screen.queryByRole('button', { name: /nonexistent/i });

    setOutput(
      'getByRole result: ' + getByResult + '\\n\\n' +
      'queryByRole result: ' + JSON.stringify(queryByResult)
    );

    unmount();
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={runQueries}>Run the real getByRole / queryByRole queries</button>
      <pre style={{ marginTop: 12, background: '#f3f4f6', padding: 12, whiteSpace: 'pre-wrap' }}>{output}</pre>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Both queries search a rendered SearchBox for a button named
        "Nonexistent" -- a button that doesn't exist. Click the button
        above. Does getByRole throw? What does queryByRole actually
        return?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Run the real getByRole / queryByRole queries". Both are searching for a button that doesn\'t exist. What does the output show for each?',
    hint: 'These are the actual @testing-library/react functions your test files import — calling them from a plain button click shows exactly what they do, with no test runner involved.',
    solution: `getByRole result: THREW: Unable to find an accessible element
with the role "button" and name "/nonexistent/i" -- confirming
getByRole genuinely throws a real, descriptive error the moment the
element isn't found, exactly as Mistake #3 describes. The real error
message is considerably longer than shown here (RTL includes a full
accessibility tree dump to help you debug), truncated to the first
line for readability.

queryByRole result: null -- confirming queryByRole returns null
instead of throwing, with zero error, zero exception, just a plain
JavaScript null value your code can check with a normal if statement
or .not.toBeInTheDocument() assertion.

Both of these are the REAL @testing-library/react functions running
in a real browser DOM -- not a simulation, not a description. This is
exactly why Mistake #3 warns against using queryBy to assert
presence: expect(screen.queryByRole(...)).toBeTruthy() would compile
and could pass, but if the element is EVER missing, you get a
confusing "expected null to be truthy" failure instead of getByRole's
immediately actionable, this-is-exactly-what-was-searched-for error
message.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`@testing-library/react`\'s `render`, `screen`, and query functions only work inside a Jest or Vitest test file — they need the test runner\'s environment to function.',
      reality: 'these are ordinary JavaScript functions that operate on a real DOM — they work identically when called from a plain browser event handler, a Node script with jsdom, or a test file; the test runner is not a dependency of the library itself.',
    },
    {
      thought: 'getByRole\'s thrown error is a generic "not found" message similar to a plain `Error("not found")`.',
      reality: 'RTL\'s getBy failure message is deliberately verbose — it includes the exact role and name you searched for, and (in a real test run) a full printout of the accessible roles actually present in the rendered output, specifically to make debugging a failed query fast.',
    },
    {
      thought: 'queryByRole returning `null` when nothing matches means the query "failed" in the same sense getByRole\'s throw represents a failure.',
      reality: 'queryByRole returning null is its NORMAL, successful behavior for "nothing found" — it is not an error state at all, which is exactly why it is the right tool for asserting absence (`expect(queryByRole(...)).toBeNull()`) rather than presence.',
    },
  ];
}
