import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-file-extensions-in-the-content-array-silently-drop-classes.html',
  styleUrl: './missing-file-extensions-in-the-content-array-silently-drop-classes.scss',
})
export class MissingFileExtensionsInTheContentArraySilentlyDropClassesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The content array is the COMPLETE list of files the JIT scanner will ever look inside — anything not matched is simply never read',
      points: [
        'A glob pattern like <code>./src/**/*.html</code> tells the scanner to look inside every <code>.html</code> file under <code>src/</code> — but it says NOTHING about <code>.ts</code>, <code>.tsx</code>, or any other file type. Those files are not partially scanned or scanned-with-limitations — they are not opened at all.',
        'This matters enormously for component frameworks like Angular, where class names can appear directly inside a <code>.ts</code> file\'s inline template string, or inside a component class as a conditionally-applied class binding — none of which lives inside a plain <code>.html</code> file if the component uses an inline template.',
      ]
    },
    {
      heading: 'The failure mode is identical to the dynamic-class-string mistake — a working build, correct runtime DOM, and simply no CSS for the affected classes',
      points: [
        'Since the missing file type is never scanned, ANY class name that appears ONLY in that file type (never duplicated anywhere in a scanned file) never gets its CSS generated — no matter how standard, static, or obviously-spelled-correctly the class name is.',
        'This is especially easy to miss when a project has a MIX of file types — if 95% of a project\'s Tailwind classes happen to live in <code>.html</code> files and only a few newer components use inline <code>.ts</code> templates, the vast majority of the app looks fine, making the few missing styles look like isolated component bugs rather than a project-wide configuration gap.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Gap — .ts Files Never Scanned',
      language: 'typescript',
      code: `// tailwind.config.ts
export default {
  content: ['./src/**/*.html'],   // ⚠️ only .html files are scanned
  // ...
};

// A newer Angular component using an INLINE template
// (no separate .html file at all):
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: \`
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full
                  text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  \`,
})
export class StatusBadgeComponent {}

// The build succeeds. The component renders. The DOM correctly has
// all those class names on the <span>. But because this file is a
// .ts file, and the content array only lists *.html, the scanner
// never opened this file at all -- none of bg-green-100,
// text-green-800, rounded-full, etc. were ever generated as CSS.
// The badge renders as plain, unstyled text.`,
    },
    {
      label: 'The Fix — Cover Every File Type That Can Contain Classes',
      language: 'typescript',
      code: `// tailwind.config.ts -- corrected
export default {
  content: [
    './src/**/*.html',   // separate template files
    './src/**/*.ts',     // inline templates + conditional class bindings
  ],
  // Brace-expansion shorthand for the same two patterns:
  // content: ['./src/**/*.{html,ts}'],
};

// Now the scanner opens EVERY .ts file too, finds the literal class
// name strings inside StatusBadgeComponent's inline template text
// (bg-green-100, text-green-800, rounded-full, etc.), and generates
// CSS for all of them -- regardless of whether they live in a
// separate .html file or directly inside a component's own template
// literal string.

// ── The general rule ────────────────────────────────────────────
// content must include EVERY file extension that can contain a
// Tailwind class name anywhere in your project -- component
// templates, inline templates, and any JS/TS file building class
// strings (even ones caught by the OTHER mistake -- dynamic strings
// still need to live in a scanned file to have any CHANCE of being
// found, even when written correctly as complete literals).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s tailwind.config.ts has <code>content: ["./src/**/*.html"]</code>. A new feature is built entirely with inline-template Angular components (no separate .html files) and Tailwind classes throughout. The build succeeds with no errors. What do the new components look like in the browser?',
    hint: 'Ask whether any file containing those class names was actually opened and read by the JIT scanner at all.',
    solution: 'They render completely unstyled — every class name lives only inside .ts files, which the content array never lists, so the scanner never opens those files and never generates any CSS for those classes. The build succeeding proves nothing about styling, since the scanner\'s file-matching step and the actual TypeScript compilation step are two entirely separate processes that don\'t validate against each other.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Tailwind automatically scans "the whole project" for class names — the content array is just a performance optimization to skip irrelevant folders like node_modules.',
      reality: 'content is not an optimization on top of a broader default scan — it is the COMPLETE, exhaustive list of what gets scanned at all. A file type or folder not matched by any pattern in the array is never opened, regardless of how "obviously part of the project" it is.'
    },
    {
      thought: 'If most of a project\'s styling works correctly, the content array configuration must already be complete and correct.',
      reality: 'A project can have the vast majority of its Tailwind classes living in one well-covered file type (e.g. .html) while a smaller, newer, or differently-structured part of the codebase (e.g. .ts inline templates) is silently uncovered — "mostly working" is not the same as "correctly configured."'
    },
    {
      thought: 'A missing file type in the content array would cause a build warning or error, since Tailwind can presumably detect when large parts of a project have zero matching classes.',
      reality: 'There is no such detection — Tailwind has no way to know what classes SHOULD exist in an unscanned file, since it never reads that file\'s contents at all. The build completes successfully with a smaller-than-expected CSS output and zero indication anything is missing.'
    }
  ];
}
