import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-sideeffects-false-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './sideeffects-false-needs-explicit-side-effect-file-list.html',
  styleUrl: './sideeffects-false-needs-explicit-side-effect-file-list.scss',
})
export class SideEffectsFalseRequiresExplicitlyListingRealSideEffectFilesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2 and QnA, Explained Through What Actually Breaks',
      points: [
        'The main page states: "Without <code>\'sideEffects\':false</code>, bundlers conservatively keep all imported files even if nothing is used from them." Its QnA adds the deeper reason: it "tells bundlers this package\'s files have no side effects — they only export values and don\'t modify globals or run code on import." This subtopic explains the FAILURE MODE that makes the flag risky: setting <code>false</code> for the WHOLE package when some files genuinely DO have side effects (like a CSS import or a polyfill) silently strips those files from the bundle.',
        '<code>"sideEffects": false</code> is a PROMISE you make to the bundler, not a description it can verify — the bundler trusts this flag completely and will remove ANY file that isn\'t directly imported by name, even one that runs meaningful code (like registering a global, patching a prototype, or applying CSS) purely as an IMPORT-TIME side effect rather than through an exported value.',
      ],
    },
    {
      heading: 'Why the Array Form Exists — Because Not Every File Is Side-Effect-Free',
      points: [
        'A CSS import like <code>import \'./button.css\'</code> has NO exported value at all — its entire purpose IS the side effect (injecting styles). If a package sets <code>"sideEffects": false</code> globally without accounting for this, a bundler correctly (by the flag\'s own promise) assumes that CSS import file does nothing observable and safely deletes it — except deleting it means the styles never load, a real, silent visual bug with no error or warning anywhere.',
        'The fix is the array form: <code>"sideEffects": ["*.css", "./src/polyfills.js"]</code> — this tells the bundler "everything else in this package is safely tree-shakeable, EXCEPT these specific files, which must always be kept regardless of whether anything imports a named export from them."',
        'This is exactly why the main page calls getting <code>sideEffects</code> configuration right "critical" for library authors specifically — an app author who gets it wrong only breaks their OWN app, but a LIBRARY author who gets it wrong breaks it silently for every single consumer of that library, in a way that\'s hard to trace back to a missing array entry in package.json.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Silent Failure — CSS Stripped by sideEffects: false',
      language: 'typescript',
      code: `// A UI library's package.json
{
  "name": "my-ui-kit",
  "sideEffects": false   // ⚠️ a blanket promise: "nothing in this package
                          //     does anything observable on import alone"
}

// button.js — has an exported value, safe to tree-shake if unused
export function Button(props) { /* ... */ }

// button.css — has NO exported value. Its entire purpose is the side
// effect of injecting styles into the page when imported.
// .my-button { padding: 8px 16px; border-radius: 4px; }

// index.js — the library's entry point
export { Button } from './button.js';
import './button.css';  // side-effect-only import, no named export

// A consumer's app.js:
import { Button } from 'my-ui-kit';
// The bundler sees "sideEffects": false and its own static analysis:
// nothing imports a named value FROM button.css, so -- trusting the
// package's OWN promise -- it deletes button.css from the bundle
// entirely. Button() still renders, but with ZERO styling, and no
// error or warning anywhere. This is a real, silent production bug.`,
    },
    {
      label: 'The Fix — Explicitly List Real Side-Effect Files',
      language: 'typescript',
      code: `// my-ui-kit's package.json, corrected
{
  "name": "my-ui-kit",
  "sideEffects": [
    "*.css",                  // every CSS file has real side effects
    "./src/polyfills.js",     // patches globals on import, no exports
    "./src/registerIcons.js"  // registers a global icon registry on import
  ]
}

// Now the bundler's rule becomes: "everything in this package is safely
// tree-shakeable EXCEPT these specific files/patterns -- always keep
// button.css, polyfills.js, and registerIcons.js in the final bundle,
// regardless of whether any named export from them is imported."

// button.js and other pure-export files are still fully tree-shaken
// if unused -- only the genuinely side-effectful files are protected.

// ── Detecting this class of bug ────────────────────────────────────────
// Build with source maps and inspect the final bundle's file list, or
// use a bundle analyzer (webpack-bundle-analyzer, rollup-plugin-visualizer)
// to confirm expected CSS/polyfill files actually made it into the output.
// A missing stylesheet with no console error is the classic symptom.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The library sets <code>"sideEffects": false</code> globally, and no file directly imports a NAMED export from <code>button.css</code>. Does the CSS file\'s content still end up in the final bundle?',
    hint: 'Ask what the bundler\'s tree-shaking rule actually checks for -- whether a file\'s EXPORTED VALUES are used, or whether the file itself was imported for some other reason. Does a CSS import have any exported value to be "used" at all?',
    solution: `No -- button.css is silently stripped from the final bundle, even
though it is directly imported by index.js. The styles simply never
load, with no error, warning, or any indication in the console that
anything went wrong.

Here's why: "sideEffects": false tells the bundler "nothing in this
package needs to be kept purely because it was imported -- only keep
files whose EXPORTED VALUES are actually used elsewhere." button.css
has no exported value at all; its entire purpose is the import-time
side effect of injecting styles. Since nothing imports a NAMED value
FROM button.css, the bundler's tree-shaking logic (trusting the
package's own sideEffects:false promise) concludes it's safe to
delete -- and does exactly that.

The fix (shown in the second code tab) is switching to the array
form: "sideEffects": ["*.css", ...] explicitly tells the bundler
"these specific files are the exception -- always keep them,
regardless of whether their exports are used." Everything NOT listed
still tree-shakes normally.

This is precisely why the main page calls sideEffects configuration
"critical" for library authors -- getting this wrong doesn't throw
an error during the library's own build; it silently breaks every
consumer's bundle in a way that's easy to misdiagnose as "the CSS
import must be wrong" rather than "the sideEffects flag lied to the
bundler."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setting "sideEffects": false in a package\'s package.json is purely an optimization hint — if it\'s wrong, the bundler will still behave correctly, just with slightly less aggressive tree-shaking.',
      reality: 'sideEffects:false is a PROMISE the bundler trusts completely and cannot verify — an incorrect false setting causes the bundler to actively DELETE files with real side effects (like CSS or polyfills), a silent correctness bug, not just a missed optimization.',
    },
    {
      thought: 'a CSS import like import \'./button.css\' is automatically recognized as a side effect by bundlers, regardless of what the package.json sideEffects field says.',
      reality: 'a bundler has no special-case awareness that CSS imports are "always side effects" — it relies entirely on the sideEffects field (or, absent one, its own conservative default of assuming everything might have side effects) to decide what\'s safe to remove.',
    },
    {
      thought: 'once a package correctly sets "sideEffects": ["*.css", ...] to protect its real side-effect files, every OTHER file in that package is guaranteed to be included in a consumer\'s bundle too, for safety.',
      reality: 'the array form works in the OPPOSITE direction — it protects only the specifically listed files/patterns, while every other file in the package remains fully eligible for tree-shaking if none of its exports are actually used by the consumer.',
    },
  ];
}
