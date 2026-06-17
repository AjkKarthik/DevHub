import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  selector: 'app-html-document-structure',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent
  ],
  templateUrl: './document-structure.html',
  styleUrl: './document-structure.scss'
})
export class HtmlDocumentStructure {

  quickRef: QuickRefItem[] = [
    { name: '<!DOCTYPE html>', type: 'keyword', desc: 'Declares HTML5 — must be the very first line' },
    { name: '<html lang="en">', type: 'keyword', desc: 'Root element; lang attribute enables screen reader language selection' },
    { name: '<head>', type: 'keyword', desc: 'Document metadata — not rendered in the viewport' },
    { name: '<meta charset="UTF-8">', type: 'keyword', desc: 'Character encoding declaration — must be within first 1024 bytes' },
    { name: '<meta name="viewport">', type: 'keyword', desc: 'Controls layout viewport for mobile — use width=device-width,initial-scale=1' },
    { name: '<title>', type: 'keyword', desc: 'Browser tab text and default bookmark name — 50-60 characters ideal' },
    { name: '<body>', type: 'keyword', desc: 'All visible page content lives here' },
    { name: '<link rel="stylesheet">', type: 'keyword', desc: 'External stylesheet — href attribute points to CSS file' },
    { name: '<script defer>', type: 'keyword', desc: 'Deferred JS executes after HTML parse — keeps scripts in <head>' },
    { name: '<meta name="description">', type: 'keyword', desc: 'SEO description shown in search result snippets — 150-160 chars' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The DOCTYPE declaration',
      points: [
        'Every HTML5 document must begin with <code>&lt;!DOCTYPE html&gt;</code> — before any whitespace or the html element.',
        'In older HTML (4.01, XHTML) the doctype referenced a DTD; HTML5 simplified it to just <code>&lt;!DOCTYPE html&gt;</code>.',
        'Without a doctype, browsers enter "quirks mode" — a legacy compatibility mode that reimplements decades-old rendering bugs. Always include it.',
        'Case-insensitive: <code>&lt;DOCTYPE HTML&gt;</code> works, but lowercase is conventional and more readable.',
      ]
    },
    {
      heading: 'The html element and lang attribute',
      points: [
        'The <code>&lt;html&gt;</code> element is the root of the document. Every other element is a descendant of it.',
        'The <code>lang</code> attribute (<code>lang="en"</code>) tells screen readers, spell-checkers, and search engines the document\'s primary language.',
        'Use IETF BCP 47 language tags: <code>lang="en-US"</code> (American English), <code>lang="fr"</code> (French), <code>lang="zh-Hant"</code> (Traditional Chinese).',
        'You can override the language mid-document: <code>&lt;span lang="es"&gt;Hola&lt;/span&gt;</code>.',
      ]
    },
    {
      heading: 'The head element — metadata container',
      points: [
        '<code>&lt;meta charset="UTF-8"&gt;</code> must appear within the first 1024 bytes so the browser can decode the rest of the document.',
        '<code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> is mandatory for responsive design — without it, mobile browsers zoom out to fit a desktop viewport.',
        '<code>&lt;title&gt;</code> is the most important SEO element after content. Target 50–60 characters; avoid keyword stuffing. This text appears in browser tabs, bookmarks, and search snippets.',
        '<code>&lt;link rel="stylesheet"&gt;</code> blocks rendering until the CSS is loaded — normal and expected, since you don\'t want a flash of unstyled content.',
        '<code>&lt;meta name="description"&gt;</code> appears in search result snippets. 150–160 characters, describing the page\'s actual content.',
      ]
    },
    {
      heading: 'Script loading strategies',
      points: [
        '<code>&lt;script&gt;</code> without attributes — blocks HTML parsing until JS is downloaded and executed. Never place in <code>&lt;head&gt;</code> without defer/async.',
        '<code>&lt;script defer&gt;</code> — downloads in parallel with HTML parsing; executes after parsing completes, in document order. Recommended default for page scripts.',
        '<code>&lt;script async&gt;</code> — downloads in parallel; executes as soon as downloaded, potentially out of order. Good for independent third-party scripts (analytics, ads).',
        'Module scripts (<code>type="module"</code>) are deferred by default. They also run in strict mode and have their own scope.',
        'Best practice: <code>defer</code> scripts in <code>&lt;head&gt;</code> for early resource discovery, or plain scripts at the end of <code>&lt;body&gt;</code>.',
      ]
    },
    {
      heading: 'Character encoding and special characters',
      points: [
        'UTF-8 supports all Unicode characters — the universal choice for modern HTML. Declaring it in meta ensures the browser doesn\'t guess (and potentially misinterpret) encoding.',
        'HTML entities encode characters that have special meaning: <code>&amp;lt;</code> for <code>&lt;</code>, <code>&amp;gt;</code> for <code>&gt;</code>, <code>&amp;amp;</code> for <code>&amp;</code>.',
        'Named entities: <code>&amp;nbsp;</code> (non-breaking space), <code>&amp;copy;</code> (©), <code>&amp;mdash;</code> (—), <code>&amp;hellip;</code> (…).',
        'Modern UTF-8 HTML can include these characters directly — entities are only required where the character has special meaning to the parser (< > &) or where the character can\'t be typed directly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Minimal document',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page — Site Name</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>`
    },
    {
      label: 'Full head section',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Character encoding — must come first -->
  <meta charset="UTF-8">

  <!-- Responsive viewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Page title (tab + SEO) -->
  <title>HTML Document Structure | DevHub</title>

  <!-- SEO description -->
  <meta name="description" content="Learn how to structure an HTML5 document correctly, from DOCTYPE to closing body tag.">

  <!-- Social sharing (Open Graph) -->
  <meta property="og:title" content="HTML Document Structure">
  <meta property="og:description" content="The complete guide to HTML5 document structure.">
  <meta property="og:image" content="https://example.com/og-image.png">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">

  <!-- Stylesheet (blocks render — expected) -->
  <link rel="stylesheet" href="/styles.css">

  <!-- Deferred JS (downloads early, runs after parse) -->
  <script defer src="/app.js"></script>
</head>
<body>
  <!-- Visible content here -->
</body>
</html>`
    },
    {
      label: 'Script strategies',
      language: 'html',
      code: `<!-- BLOCKING — avoid in <head> without defer/async -->
<script src="app.js"></script>

<!-- DEFERRED — recommended for page scripts -->
<!-- Downloads in parallel, runs after HTML parse, in order -->
<script defer src="app.js"></script>
<script defer src="ui.js"></script>  <!-- runs after app.js -->

<!-- ASYNC — for independent third-party scripts -->
<!-- Downloads in parallel, runs immediately when ready (out of order) -->
<script async src="analytics.js"></script>

<!-- MODULE — deferred by default, strict mode, own scope -->
<script type="module" src="main.js"></script>

<!-- INLINE DEFER workaround -->
<!-- For inline scripts that depend on deferred modules, listen for DOMContentLoaded -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
  });
</script>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing DOCTYPE',
      wrong: `<html lang="en">
<head><title>Page</title></head>
<body><h1>Hello</h1></body>
</html>`,
      right: `<!DOCTYPE html>
<html lang="en">
<head><title>Page</title></head>
<body><h1>Hello</h1></body>
</html>`,
      explanation: 'Without <!DOCTYPE html>, browsers render in quirks mode. This reimplements legacy IE bugs and causes inconsistent layout cross-browser.'
    },
    {
      title: 'Missing lang attribute on html',
      wrong: `<html>`,
      right: `<html lang="en">`,
      explanation: 'The lang attribute tells screen readers the document language. Without it, TTS software may use the wrong pronunciation rules, making the page inaccessible.'
    },
    {
      title: 'Missing viewport meta tag',
      wrong: `<meta charset="UTF-8">
<title>My Mobile Site</title>`,
      right: `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Mobile Site</title>`,
      explanation: 'Without the viewport meta tag, mobile browsers zoom out to show a desktop-width layout. The site appears tiny and unresponsive on phones.'
    },
    {
      title: 'Blocking script in head without defer',
      wrong: `<head>
  <script src="app.js"></script>
</head>`,
      right: `<head>
  <script defer src="app.js"></script>
</head>`,
      explanation: 'A plain <script> in <head> blocks HTML parsing until the JS downloads and runs. This delays page render. Use defer to download early but execute after parse.'
    },
    {
      title: 'charset declaration too late',
      wrong: `<head>
  <title>My Page</title>
  <meta charset="UTF-8">  <!-- too late -->
</head>`,
      right: `<head>
  <meta charset="UTF-8">  <!-- first -->
  <title>My Page</title>
</head>`,
      explanation: 'The charset must appear within the first 1024 bytes. Placing it after <title> means the browser may start decoding the title with the wrong encoding.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a valid HTML5 document from scratch',
    language: 'html',
    description: `Write a complete, valid HTML5 document for a portfolio homepage that includes:
- Correct DOCTYPE and html element with appropriate lang
- Full head section: charset, viewport, title (50-60 chars), SEO description, a linked stylesheet
- A deferred external script reference
- A body with an h1 and a short paragraph about yourself
- Proper HTML entity usage for at least one special character (© or →)`,
    hints: [
      'DOCTYPE must be the absolute first line — no blank lines before it',
      'lang="en" is the minimum; lang="en-US" is more specific',
      'Charset meta comes before the title element',
      'defer goes on the script tag, not async (which would run out of order)',
      'Use &copy; for © and &rarr; for →'
    ],
    starterCode: `<!-- Build your complete HTML5 document here -->
`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Johnson — Frontend Developer Portfolio</title>
  <meta name="description" content="Portfolio of Alex Johnson, a frontend developer specialising in accessible, performant web experiences.">
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/app.js"></script>
</head>
<body>
  <h1>Alex Johnson</h1>
  <p>Frontend developer based in London. I build fast, accessible web apps using HTML, CSS &amp; JavaScript. &copy; 2025 Alex Johnson.</p>
</body>
</html>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What rendering mode does a browser use when <!DOCTYPE html> is missing?',
      options: ['Standards mode', 'Strict mode', 'Quirks mode', 'Compatibility mode'],
      answer: 2,
      explanation: 'Without a DOCTYPE, browsers switch to quirks mode — a legacy mode that mimics old IE bugs. Always include <!DOCTYPE html> as the first line.'
    },
    {
      q: 'Which meta tag is mandatory for responsive mobile layout?',
      options: [
        '<meta name="mobile" content="yes">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<meta name="responsive" content="true">',
        '<meta http-equiv="X-UA-Compatible">'
      ],
      answer: 1,
      explanation: 'The viewport meta tag tells mobile browsers to use the device width as the layout viewport instead of zooming out to a desktop-width virtual viewport.'
    },
    {
      q: 'What is the key difference between defer and async script attributes?',
      options: [
        'defer downloads faster; async is slower',
        'defer runs after HTML parse in order; async runs immediately when downloaded (out of order)',
        'async is for ES modules; defer is for classic scripts',
        'They are identical — async is just an alias for defer'
      ],
      answer: 1,
      explanation: 'defer runs scripts after HTML parsing completes, preserving document order. async runs each script as soon as it downloads, ignoring order. Use defer for page scripts, async for independent third-party snippets.'
    },
    {
      q: 'Where must <meta charset="UTF-8"> appear in the document?',
      options: [
        'After all other meta tags',
        'Before the closing </head> tag',
        'Within the first 1024 bytes — typically first in <head>',
        'In the <body>'
      ],
      answer: 2,
      explanation: 'The charset declaration must appear within the first 1024 bytes of the file so the browser can use the correct encoding when parsing the rest of the document, including the title.'
    },
    {
      q: 'Which attribute on <html> helps screen readers announce the correct language?',
      options: ['dir', 'lang', 'locale', 'charset'],
      answer: 1,
      explanation: 'The lang attribute specifies the document\'s primary language using BCP 47 tags (e.g. lang="en", lang="fr", lang="zh-Hant"). Screen readers use it to select the right TTS voice and pronunciation rules.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is it okay to have two <head> elements in an HTML document?',
      a: 'No. An HTML document has exactly one <head> and one <body>. Duplicate <head> elements cause the browser to close the first and treat the second as part of <body>, breaking metadata parsing.'
    },
    {
      q: 'Does the title element affect SEO?',
      a: 'Yes — significantly. The <title> is one of the most important on-page SEO signals. Search engines display it in result snippets and use it to understand the page topic. Keep it 50–60 characters, include the primary keyword near the front, and make it unique per page.'
    },
    {
      q: 'Can I put visible content inside <head>?',
      a: 'No. Content in <head> is metadata — the browser does not render it visually. Any text in <head> outside of recognized elements (script, style, etc.) is moved to <body> by the parser.'
    },
    {
      q: 'What\'s the difference between &nbsp; and a regular space?',
      a: 'A regular space can wrap (the browser may break a line there). A non-breaking space (&nbsp;) prevents line breaks between the words on either side. Use it to keep short pairs together (e.g. "10&nbsp;px", "Dr.&nbsp;Smith") — but never for indentation; use CSS margin/padding for that.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Every HTML5 document follows a fixed skeleton: DOCTYPE → html[lang] → head[charset,viewport,title] → body.',
    mustKnow: [
      '<!DOCTYPE html> must be the absolute first line — triggers standards mode',
      'lang attribute on <html> is required for accessibility and i18n',
      'charset meta must appear within the first 1024 bytes',
      'viewport meta is mandatory for responsive design on mobile',
      'defer downloads early, runs after parse in order — preferred for page scripts',
      'async runs immediately when downloaded, out of order — for independent scripts',
    ],
    interviewFocus: [
      'What happens without DOCTYPE? Quirks mode — legacy rendering bugs',
      'defer vs async — execution timing and order guarantees',
      'Why charset must come before title in <head>',
      'Which meta tag is required for responsive mobile layout and why',
    ]
  };
}