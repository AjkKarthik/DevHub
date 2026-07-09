import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dompurify-strips-handlers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dompurify-strips-handlers-keeps-allowed-tags.html',
  styleUrl: './dompurify-strips-handlers-keeps-allowed-tags.scss',
})
export class DompurifyStripsHandlersKeepsAllowedTagsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Code Tabs Show the API, But Never the Actual Sanitized Output',
      points: [
        'The XSS prevention code tab shows <code>DOMPurify.sanitize(html, &#123; ALLOWED_TAGS: [...], ALLOWED_ATTR: [...] &#125;)</code> — but the reader never sees the actual STRING that comes out the other side for a genuinely malicious input. Does DOMPurify remove the whole malicious tag, or just the dangerous part of it?',
        'This subtopic runs DOMPurify with the exact same config from the main page against several deliberately crafted inputs — a script tag, an onerror handler on an allowed tag, and a javascript: URL in an href — and displays the real sanitized output string for each.',
      ],
    },
    {
      heading: 'DOMPurify Is Surgical, Not All-or-Nothing',
      points: [
        'A common assumption is that any "malicious-looking" input gets rejected entirely — DOMPurify does not work that way. It parses the HTML, walks the resulting tree, and removes ONLY the specific disallowed pieces: a disallowed tag is removed (its safe children, if any, may be kept or unwrapped depending on config), a disallowed attribute is stripped from an otherwise-allowed tag, and a dangerous URL scheme (javascript:) in an allowed attribute like href is neutralized — while everything ELSE about that same element survives untouched.',
        'This means &lt;strong onclick="evil()"&gt;bold text&lt;/strong&gt; with ALLOWED_TAGS including "strong" but ALLOWED_ATTR excluding "onclick" comes out as &lt;strong&gt;bold text&lt;/strong&gt; — the tag and its safe text content survive; only the dangerous attribute is removed. This is precisely why specifying BOTH an explicit ALLOWED_TAGS and ALLOWED_ATTR list (rather than relying on defaults) matters — DOMPurify\'s defaults are already fairly strict, but an explicit allowlist is what the main page\'s own code demonstrates and is the safer, auditable choice.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "dompurify-output-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "dompurify": "^3.1.0"
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
  <head><title>DOMPurify output demo</title></head>
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
import DOMPurify from 'dompurify';

const CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

const SAMPLES = [
  {
    label: 'A <script> tag',
    input: '<p>Hello</p><script>window.__pwned = true;</script>',
  },
  {
    label: 'An onerror handler on an allowed tag',
    input: '<strong onclick="window.__pwned = true">bold text</strong>',
  },
  {
    label: 'A javascript: URL in an allowed href',
    input: '<a href="javascript:window.__pwned = true">click me</a>',
  },
  {
    label: 'A disallowed <img> mixed with allowed tags',
    input: '<p>Real content</p><img src=x onerror="window.__pwned = true">',
  },
];

export default function App() {
  const [results, setResults] = useState(null);

  function runAll() {
    window.__pwned = false;
    const out = SAMPLES.map(s => ({
      label: s.label,
      input: s.input,
      output: DOMPurify.sanitize(s.input, CONFIG),
    }));
    setResults(out);
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button onClick={runAll}>Run DOMPurify.sanitize() on all 4 samples</button>
      {results && results.map((r, i) => (
        <div key={i} style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
          <strong>{r.label}</strong>
          <p style={{ fontSize: 13, color: '#555' }}>Input: <code>{r.input}</code></p>
          <p style={{ fontSize: 13 }}>Sanitized output: <code>{r.output || '(empty string)'}</code></p>
        </div>
      ))}
      <p style={{ marginTop: 12, fontSize: 13 }}>window.__pwned after sanitizing (should stay false — no dangerouslySetInnerHTML is used here, this only checks the sanitize() output string itself): {String(window.__pwned)}</p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Run DOMPurify.sanitize()". For each of the 4 samples, compare the input to the sanitized output — what survives, and what specifically gets removed?',
    hint: 'Check each sample individually: does the WHOLE input disappear, or does DOMPurify keep the safe parts and remove only the dangerous piece?',
    solution: `Sample 1 (&lt;script&gt; tag): the &lt;p&gt;Hello&lt;/p&gt; survives
completely intact; the entire &lt;script&gt; element (including its
contents) is removed entirely — script is not in ALLOWED_TAGS, so
DOMPurify strips the whole element, not just part of it.

Sample 2 (onclick on &lt;strong&gt;): the output is
&lt;strong&gt;bold text&lt;/strong&gt; — the tag AND its text content
survive, because "strong" IS in ALLOWED_TAGS. Only the onclick
attribute is removed, because it's not in ALLOWED_ATTR. This is the
surgical behavior the theory describes: the safe parts of an element
can survive even when one specific attribute is dangerous.

Sample 3 (javascript: URL in href): the output keeps the
&lt;a&gt;click me&lt;/a&gt; tag and text, but the href attribute's
value is neutralized (DOMPurify recognizes javascript: as a
dangerous URL scheme even though "href" itself is in ALLOWED_ATTR —
the attribute NAME being allowed doesn't mean any VALUE is trusted).

Sample 4 (disallowed &lt;img&gt; mixed with allowed content): the
&lt;p&gt;Real content&lt;/p&gt; survives completely; the entire
&lt;img&gt; element is removed (img is not in ALLOWED_TAGS).

The consistent pattern across all four: DOMPurify never does an
all-or-nothing rejection of the whole input string. It parses the
tree and removes exactly the disallowed pieces — tags not in
ALLOWED_TAGS, attributes not in ALLOWED_ATTR, and dangerous URL
schemes in attributes that ARE allowed by name. Everything else
survives, which is why an explicit, minimal ALLOWED_TAGS/ALLOWED_ATTR
list (as the main page's own code demonstrates) is the actual safety
mechanism — not DOMPurify somehow "detecting bad intent" in the
input as a whole.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if any part of an HTML string is malicious, DOMPurify.sanitize() rejects and discards the entire input, returning an empty string.',
      reality: 'DOMPurify surgically removes only the specific disallowed tags, attributes, and dangerous URL values — safe content elsewhere in the same string survives completely intact.',
    },
    {
      thought: 'once an attribute name like "href" is in ALLOWED_ATTR, any VALUE for that attribute is considered safe and passes through unchanged.',
      reality: 'DOMPurify additionally checks attribute VALUES for dangerous patterns (like javascript: URL schemes) even when the attribute NAME itself is allowed — allowing "href" doesn\'t mean every possible href value is trusted.',
    },
    {
      thought: 'DOMPurify\'s default configuration (no ALLOWED_TAGS/ALLOWED_ATTR specified) is too permissive to be safe — an explicit allowlist is always strictly required.',
      reality: 'DOMPurify\'s defaults already strip genuinely dangerous content (script tags, event handlers, javascript: URLs) — an explicit allowlist is still the recommended, more auditable practice (as the main page\'s own code demonstrates), but it\'s a defense-in-depth improvement, not the only thing standing between the app and an XSS payload.',
    },
  ];
}
