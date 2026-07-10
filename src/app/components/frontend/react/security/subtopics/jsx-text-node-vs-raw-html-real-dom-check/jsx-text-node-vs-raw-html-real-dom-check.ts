import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-jsx-text-node-vs-raw-html-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './jsx-text-node-vs-raw-html-real-dom-check.html',
  styleUrl: './jsx-text-node-vs-raw-html-real-dom-check.scss',
})
export class JsxTextNodeVsRawHtmlRealDomCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Says "Text Node" — This Checks the ACTUAL DOM, Not Just the Visual Result',
      points: [
        'The theory section states: "React converts text to a text node — no HTML executes." Visually, both a safely-escaped and an actually-executed <img onerror=...> tag might look similar at a glance if you only check "did an alert box pop up" — this subtopic instead directly inspects the real DOM structure React produced, using <code>document.querySelectorAll</code>, to show the concrete, structural difference.',
        'The payload used is a classic, harmless-to-inspect XSS test string: <code>&lt;img src=x onerror="window.__xssFired = true"&gt;</code> — if this ever becomes a REAL <code>&lt;img&gt;</code> element in the DOM, the browser will attempt to load "x" as an image, fail, and fire the onerror handler, setting a global flag we can safely check without an actual alert() popup.',
      ],
    },
    {
      heading: 'What "Text Node" Actually Means at the DOM Level',
      points: [
        'When you write <code>{userInput}</code> in JSX, React calls the DOM equivalent of <code>document.createTextNode(userInput)</code> — this creates a Text node, a DOM node type that can ONLY ever contain literal character data. It is structurally impossible for a Text node to contain a child &lt;img&gt; element, an event handler, or anything else "element-like" — the browser\'s DOM API itself has no such capability for that node type.',
        'This is a fundamentally different (and stronger) guarantee than "the string gets escaped before being inserted as HTML" — there is no HTML parsing step involved in the JSX-text-node path AT ALL, so there is no injection point in the first place. dangerouslySetInnerHTML, by contrast, does go through the browser\'s actual HTML parser (<code>innerHTML</code> under the hood) — which IS capable of creating real, executable elements from the string, which is precisely why it needs sanitization and JSX text nodes never do.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "jsx-text-node-demo",
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
  <head><title>JSX text node demo</title></head>
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
      content: `import { useState, useRef } from 'react';

const PAYLOAD = '<img src=x onerror="window.__xssFired = true">';

export default function App() {
  const [output, setOutput] = useState('Click a button below.');
  const jsxRef = useRef(null);
  const rawRef = useRef(null);

  function checkJsxVersion() {
    window.__xssFired = false;
    // Wait a tick for the browser to have attempted any img load (there won't be one).
    setTimeout(() => {
      const imgCount = jsxRef.current.querySelectorAll('img').length;
      setOutput(
        'JSX {payload} version:\\n' +
        'Real <img> elements found in the DOM: ' + imgCount + '\\n' +
        'window.__xssFired: ' + window.__xssFired + '\\n' +
        'Actual textContent rendered: ' + JSON.stringify(jsxRef.current.textContent)
      );
    }, 50);
  }

  function checkRawHtmlVersion() {
    window.__xssFired = false;
    setTimeout(() => {
      const imgCount = rawRef.current.querySelectorAll('img').length;
      setOutput(
        'dangerouslySetInnerHTML (UNSANITIZED) version:\\n' +
        'Real <img> elements found in the DOM: ' + imgCount + '\\n' +
        'window.__xssFired: ' + window.__xssFired + '\\n' +
        '(This is exactly why dangerouslySetInnerHTML needs DOMPurify first.)'
      );
    }, 50);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <div ref={jsxRef} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
        JSX version: {PAYLOAD}
      </div>
      <div
        ref={rawRef}
        style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}
        dangerouslySetInnerHTML={{ __html: 'Raw HTML version: ' + PAYLOAD }}
      />
      <button onClick={checkJsxVersion}>Check JSX version's real DOM</button>
      <button onClick={checkRawHtmlVersion} style={{ marginLeft: 8 }}>Check raw HTML version's real DOM</button>
      <pre style={{ marginTop: 12, background: '#f3f4f6', padding: 12, whiteSpace: 'pre-wrap' }}>{output}</pre>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click both "Check" buttons. Compare the real &lt;img&gt; element count and window.__xssFired for the JSX version versus the unsanitized dangerouslySetInnerHTML version.',
    hint: 'Ask whether the JSX-rendered div actually created a child &lt;img&gt; DOM element at all, versus what the raw-HTML div actually parsed the string into.',
    solution: `JSX version: 0 real &lt;img&gt; elements found, window.__xssFired
stays false. The div's actual textContent shows the payload as a
literal string, including the angle brackets themselves -- React
created ONE text node containing the characters
"&lt;img src=x onerror=..." verbatim, and the browser never ran its
HTML parser on that content at all. There was structurally no way
for a real &lt;img&gt; element to come into existence.

Raw HTML version (unsanitized dangerouslySetInnerHTML): 1 real
&lt;img&gt; element found, window.__xssFired becomes true. The
string was passed through the browser's actual innerHTML parser,
which created a genuine &lt;img&gt; DOM element with a real onerror
attribute. The browser then tried to load "x" as an image source,
failed, and executed the onerror JavaScript -- setting the flag.

This confirms the theory section's distinction is not just about
"escaping" in the abstract -- it's a structural guarantee. The JSX
path never touches an HTML parser at all, so there is no injection
point to exploit in the first place. The dangerouslySetInnerHTML
path DOES use the real HTML parser, which is exactly why -- and
only why -- it needs DOMPurify sanitization before any untrusted
string reaches it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'React "escaping" JSX text means it scans the string for dangerous patterns like &lt;script&gt; and removes or blocks them, similar to what a sanitizer does.',
      reality: 'React never scans or filters the string at all — it creates a DOM Text node, a node type that structurally cannot contain elements, attributes, or event handlers. There\'s no pattern-matching or removal happening; the HTML parser is simply never invoked.',
    },
    {
      thought: 'if a string rendered via JSX visually shows the angle brackets and tag name as plain text, that\'s React "failing" to fully process the HTML, similar to a bug.',
      reality: 'showing the literal characters as visible text IS the correct, safe, intended behavior — it\'s the same reason viewing a &lt;script&gt; tag\'s source code in a text editor doesn\'t execute it; the browser\'s HTML parser was never invoked on that content.',
    },
    {
      thought: 'testing whether an XSS payload "worked" requires checking for a visible alert() popup — if no popup appears, the content is safe.',
      reality: 'a payload can execute (fire the onerror handler, run arbitrary code) without ever calling alert() — checking the actual DOM structure (element count, node types) is a more direct and reliable test than watching for a specific visible side effect.',
    },
  ];
}
