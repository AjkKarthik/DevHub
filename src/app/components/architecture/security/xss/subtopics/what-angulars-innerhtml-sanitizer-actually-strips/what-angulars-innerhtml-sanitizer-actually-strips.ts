import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Angular Sanitizes [innerHTML] By Default',
    points: [
      'Contrary to a common assumption, binding <code>[innerHTML]="value"</code> in Angular does NOT skip sanitization — Angular runs every value bound to an <code>innerHTML</code> property through its built-in HTML sanitizer before inserting it into the DOM, unless you explicitly disable that with <code>DomSanitizer.bypassSecurityTrustHtml()</code>.',
      'The sanitizer strips <code>&lt;script&gt;</code> tags entirely, removes event-handler attributes like <code>onerror</code>, <code>onclick</code>, and <code>onload</code> from every remaining element, and strips <code>javascript:</code> URLs from <code>href</code>/<code>src</code> attributes.',
      'Concretely: binding <code>[innerHTML]</code> to the string <code>&lt;img src=x onerror="alert(1)"&gt;</code> renders a broken <code>&lt;img src="x"&gt;</code> element with the <code>onerror</code> attribute silently removed — the alert never fires. The dev console logs a "sanitizing HTML stripped some content" warning so you notice.',
      'The real danger is <code>DomSanitizer.bypassSecurityTrustHtml()</code> — its entire purpose is telling Angular "trust this string completely, skip sanitization." Calling it on untrusted user content defeats Angular\'s protection outright; it exists for HTML you have already verified is safe (e.g., static marketing copy from a CMS you control).',
    ],
  },
  {
    heading: 'When Angular\'s Sanitizer Is (and Isn\'t) Enough',
    points: [
      'For plain user-generated content rendered as HTML — comments, bios, chat messages — binding it via <code>[innerHTML]</code> with NO bypass is safe as-is; you do not need DOMPurify in front of it.',
      'You need DOMPurify (and then <code>bypassSecurityTrustHtml</code>) only when Angular\'s sanitizer is too aggressive for a legitimate use case — e.g., rich text with <code>&lt;style&gt;</code> blocks or custom SVG that Angular\'s allowlist strips but you have verified is safe.',
      'Angular\'s sanitizer targets <code>SecurityContext.HTML</code> specifically — it does not protect bindings to other contexts (<code>[href]</code>/<code>[src]</code> for <code>SecurityContext.URL</code>, <code>[style]</code> for <code>SecurityContext.STYLE</code>) from their own distinct risks; each context is sanitized independently.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Plain [innerHTML] vs bypassSecurityTrustHtml',
    language: 'typescript',
    code: `import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-comment',
  template: \`
    <!-- Angular sanitizes this binding automatically -- SAFE as-is -->
    <div [innerHTML]="rawComment"></div>

    <!-- bypassSecurityTrustHtml disables that protection entirely -->
    <div [innerHTML]="trustedComment"></div>
  \`,
})
export class CommentComponent {
  rawComment = '<img src=x onerror="alert(1)"> nice post!';

  // trustedComment RUNS THROUGH bypassSecurityTrustHtml -- Angular will
  // render it EXACTLY as given, onerror and all, because bypass means
  // "I already verified this is safe." Passing rawComment through this
  // (a real user's comment) would be the actual mistake -- not the
  // plain [innerHTML] binding above it.
  trustedComment;

  constructor(private sanitizer: DomSanitizer) {
    this.trustedComment = this.sanitizer.bypassSecurityTrustHtml(this.rawComment);
  }
}

// Rendered result of [innerHTML]="rawComment" (sanitized, safe):
//   <img src="x"> nice post!          -- onerror stripped, no alert
//
// Rendered result of [innerHTML]="trustedComment" (bypassed, UNSAFE
// here only because rawComment happens to be untrusted input):
//   <img src="x" onerror="alert(1)"> nice post!   -- alert WILL fire`,
  },
  {
    label: 'A Correct DOMPurify + bypassSecurityTrustHtml Flow',
    language: 'typescript',
    code: `import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

// Use this pipe ONLY when Angular's own sanitizer is too strict for a
// case you've verified is safe (e.g. a rich-text editor's <style>
// blocks) -- DOMPurify runs FIRST, so bypassSecurityTrustHtml is only
// ever applied to already-cleaned output, never raw user input.
@Pipe({ name: 'richHtml', standalone: true })
export class RichHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(rawHtml: string): SafeHtml {
    const cleaned = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'li', 'style'],
      ALLOWED_ATTR: ['href', 'class'],
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }
}

// Template: <div [innerHTML]="post.body | richHtml"></div>
//
// The order matters: DOMPurify.sanitize() removes <script>, event
// handlers, and javascript: URLs FIRST. Only the already-safe result
// is ever handed to bypassSecurityTrustHtml() -- the raw, unsanitized
// post.body string never reaches the DOM directly.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A component binds <code>[innerHTML]</code> (no bypass) to the string <code>&lt;svg onload="alert(1)"&gt;&lt;circle r="1"/&gt;&lt;/svg&gt;</code>. Does the alert fire?',
  hint: 'Angular\'s sanitizer strips <code>on*</code> attributes from every element it keeps — not just <code>&lt;img&gt;</code>.',
  solution: `// No -- the alert does not fire.

// Angular's sanitizer strips the onload attribute from the <svg>
// element exactly the same way it strips onerror from <img> -- the
// rule is "remove event-handler attributes," applied to every element
// the sanitizer allows through, not a special case for one tag.

// Rendered result:
//   <svg><circle r="1"></circle></svg>
// A tiny circle renders. onload is gone. No script executes.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>[innerHTML]</code> is inherently unsafe with any user-supplied string, so it should always be avoided in favor of <code>{{ }}</code> text interpolation.',
    reality: 'Angular sanitizes every <code>[innerHTML]</code> binding by default. It is exactly as safe as <code>{{ }}</code> interpolation for untrusted content — the difference is only that <code>[innerHTML]</code> lets safe HTML structure (like a sanitized <code>&lt;strong&gt;</code>) through, where <code>{{ }}</code> would show the tag as literal text. Neither one needs to be "avoided" on security grounds alone.',
  },
  {
    thought: '<code>bypassSecurityTrustHtml()</code> makes HTML safe to render.',
    reality: 'It does the opposite — it tells Angular to skip its own safety check entirely. The name is accurate: you are asserting the HTML is ALREADY safe (verified by you, some other way), not asking Angular to make it safe. Calling it on a value you have not independently verified is the actual XSS risk.',
  },
  {
    thought: 'Since Angular already sanitizes <code>[innerHTML]</code>, DOMPurify is never useful in an Angular app.',
    reality: 'DOMPurify becomes useful specifically when Angular\'s allowlist is too strict for a legitimate need — e.g. rendering user-authored rich text that includes tags or attributes Angular\'s sanitizer removes. In that case, DOMPurify with a deliberately chosen allowlist runs first, and only its cleaned output is passed to <code>bypassSecurityTrustHtml()</code>.',
  },
];

@Component({
  selector: 'app-sec-xss-innerhtml-sanitizer',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './what-angulars-innerhtml-sanitizer-actually-strips.html',
  styleUrl: './what-angulars-innerhtml-sanitizer-actually-strips.scss',
})
export class WhatAngularsInnerhtmlSanitizerActuallyStripsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
