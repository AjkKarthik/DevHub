import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-protocol-relative-redirect-bypass-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './protocol-relative-url-bypasses-naive-redirect-check.html',
  styleUrl: './protocol-relative-url-bypasses-naive-redirect-check.scss',
})
export class ProtocolRelativeUrlBypassesNaiveRedirectCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #5\'s Own Fix Contains a Specific, Named Edge Case — Worth Testing Directly',
      points: [
        'Mistake #5\'s "right" code is: <code>redirect?.startsWith(\'/\') &amp;&amp; !redirect.startsWith(\'//\')</code> — the SECOND condition explicitly guards against a "protocol-relative" URL, but the main page never explains what that actually IS or shows a naive version that gets it wrong.',
        'This subtopic builds exactly that comparison: a NAIVE check using only <code>startsWith(\'/\')</code> (missing the <code>//</code> guard) against the FULL, correct check from the main page\'s own code — and runs both against a real protocol-relative URL to see which one is fooled.',
      ],
    },
    {
      heading: 'Why //evil.com Is a Real, Working Redirect Target',
      points: [
        'A "protocol-relative URL" (also called a scheme-relative URL) starts with <code>//</code> instead of a full <code>https://</code>. The browser resolves it by keeping the CURRENT page\'s protocol and substituting everything after the <code>//</code> as a completely new host: on an https page, <code>//evil.com/phish</code> resolves to <code>https://evil.com/phish</code> — a fully different origin.',
        'A naive check like <code>redirect.startsWith(\'/\')</code> is TRUE for <code>//evil.com</code> — because the string genuinely does start with a single <code>/</code> character (it just happens to have a SECOND one immediately after). The check passes, the code treats it as "a safe relative path," and <code>router.push(\'//evil.com\')</code> genuinely navigates the browser to evil.com, exactly like an absolute cross-origin redirect would.',
        'This is precisely why the main page\'s fix has TWO conditions ANDed together, not one — <code>startsWith(\'/\')</code> alone is necessary but not sufficient; <code>!startsWith(\'//\')</code> is the specific guard against this exact bypass.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "open-redirect-bypass-demo",
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
  <head><title>Open redirect bypass demo</title></head>
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

// NAIVE: only checks for a leading slash -- missing the main page's own // guard.
function naiveIsSafeRedirect(to) {
  return to.startsWith('/');
}

// CORRECT: the exact check from the main page's own Mistake #5 fix.
function correctIsSafeRedirect(to) {
  return to.startsWith('/') && !to.startsWith('//');
}

const TEST_URLS = [
  '/dashboard',
  '//evil.com/phish',
  'https://evil.com',
  '/settings?tab=profile',
];

export default function App() {
  const [results, setResults] = useState(null);

  function runTests() {
    setResults(TEST_URLS.map(url => ({
      url,
      naive: naiveIsSafeRedirect(url),
      correct: correctIsSafeRedirect(url),
    })));
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={runTests}>Run both checks against 4 test URLs</button>
      {results && (
        <table style={{ marginTop: 12, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 6 }}>URL</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 6 }}>naiveIsSafeRedirect</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 6 }}>correctIsSafeRedirect</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 6, fontFamily: 'monospace' }}>{r.url}</td>
                <td style={{ padding: 6, color: r.naive ? 'green' : 'red' }}>{String(r.naive)}</td>
                <td style={{ padding: 6, color: r.correct ? 'green' : 'red' }}>{String(r.correct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Run both checks against the 4 test URLs. Find the ONE row where naiveIsSafeRedirect and correctIsSafeRedirect disagree — which URL is it, and which function got it wrong?',
    hint: 'Focus on the URL that starts with two slashes — check what String.startsWith(\'/\') alone returns for it versus the combined check.',
    solution: `The row that disagrees is "//evil.com/phish": naiveIsSafeRedirect
returns TRUE (incorrectly treating it as safe), while
correctIsSafeRedirect returns FALSE (correctly rejecting it).

This is exactly the bypass the theory section describes:
"//evil.com/phish".startsWith('/') is true, because the very first
character genuinely is a forward slash -- JavaScript's startsWith
only looks at the beginning of the string, and doesn't care that a
SECOND slash immediately follows. The naive check has no way to
distinguish "a path on this same site" from "a protocol-relative URL
to a completely different site," because both start with the same
single character.

The other three URLs agree between both functions: "/dashboard" and
"/settings?tab=profile" are correctly accepted by both (genuine
relative paths, no double-slash prefix), and "https://evil.com" is
correctly rejected by both (doesn't start with "/" at all, so even
the naive check catches this simpler, more obvious case).

This confirms precisely why Mistake #5's fix needs BOTH conditions:
startsWith('/') alone catches the obvious case (a full https://
absolute URL) but is silently bypassed by the more subtle
protocol-relative form -- the !startsWith('//') condition is the
specific, necessary guard against exactly that bypass, not a
redundant extra check.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'redirect.startsWith(\'/\') is a sufficient check to guarantee a URL stays on the same site — anything starting with a slash is a relative path by definition.',
      reality: 'a protocol-relative URL like "//evil.com" also starts with a single "/" character — startsWith(\'/\') alone cannot distinguish it from a genuine same-site relative path, which is exactly why the main page\'s own fix adds a second, explicit !startsWith(\'//\') condition.',
    },
    {
      thought: '"//evil.com" is just a malformed or broken URL that browsers would reject or fail to navigate to.',
      reality: 'protocol-relative URLs are valid, well-defined, and fully functional — browsers resolve "//evil.com" by inheriting the current page\'s protocol (http: or https:) and treating everything after the slashes as a real, different host to navigate to.',
    },
    {
      thought: 'this bypass is a rare, unlikely-to-be-exploited edge case, since most redirect parameters in practice come from a trusted login flow, not directly from attacker input.',
      reality: 'the whole scenario Mistake #5 describes is an attacker CRAFTING the redirect query parameter themselves (e.g. in a phishing link like myapp.com/login?redirect=//evil.com) — the redirect value is attacker-controlled input by design, not trusted data from your own login flow.',
    },
  ];
}
