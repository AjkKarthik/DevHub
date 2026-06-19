import { Component, signal, computed } from '@angular/core';

interface IPQuestion {
  q: string;
  a: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

const QUESTIONS: IPQuestion[] = [
  // Beginner
  { difficulty: 'beginner', topic: 'Cascade',
    q: 'What is the difference between the CSS cascade and specificity?',
    a: 'The cascade is the algorithm that decides which CSS rule applies when multiple rules target the same property. It evaluates: (1) Origin and importance (!important, author, user agent), (2) Specificity — a score comparing (ID, class, element) columns, (3) Source order — last rule wins ties. Specificity is just one step in the cascade, not the whole algorithm.' },
  { difficulty: 'beginner', topic: 'Cascade',
    q: 'How is CSS specificity calculated?',
    a: 'Specificity is a four-column tuple: (inline, ID, class/attr/pseudo-class, element/pseudo-element). Inline styles: (1,0,0,0). ID: (0,1,0,0). Class, attribute, pseudo-class: (0,0,1,0). Element, pseudo-element: (0,0,0,1). Columns are compared left to right — the first column that differs decides. It is NOT decimal: 10 classes (0,0,10,0) never beat 1 ID (0,1,0,0).' },
  { difficulty: 'beginner', topic: 'Box Model',
    q: 'What does box-sizing: border-box do?',
    a: 'border-box changes the box model so specified width and height include padding and border. With the default content-box, a 200px element with 20px padding becomes 240px wide. With border-box it stays 200px. Always apply it universally: *, *::before, *::after { box-sizing: border-box }.' },
  { difficulty: 'beginner', topic: 'Box Model',
    q: 'What is margin collapse and when does it happen?',
    a: 'Adjacent vertical margins between block-level siblings collapse to the larger value (not added). margin-bottom: 32px + margin-top: 16px = 32px gap. Collapse only happens: vertically (not horizontally), between block-level elements, and NOT inside flex or grid containers. It also happens between a parent\'s top/bottom margin and a child\'s margin when there is no border, padding, or formatting context between them.' },
  { difficulty: 'beginner', topic: 'Selectors',
    q: 'What is the difference between :is() and :where()?',
    a: 'Both accept a forgiving selector list (invalid selectors are ignored). The difference is specificity: :is() takes the specificity of its highest-specificity argument — :is(#id, .class) = (0,1,0,0). :where() always contributes 0 specificity regardless of its arguments. Use :where() for resets and defaults you want easy to override; use :is() when you want the specificity of the matched element.' },
  { difficulty: 'beginner', topic: 'Selectors',
    q: 'What does :has() do and why is it significant?',
    a: ':has() is the CSS parent selector — it selects elements that contain a matching descendant. .card:has(img) selects cards containing images. .form:has(input:invalid) selects forms with invalid inputs. It is significant because CSS previously had no way to select a parent based on its children — JavaScript was required. Supported in all modern browsers since 2023.' },
  { difficulty: 'beginner', topic: 'Layout',
    q: 'What is the difference between display: none and visibility: hidden?',
    a: 'display: none removes the element from layout entirely — it takes no space and is invisible. visibility: hidden hides the element visually but the space is preserved. Also: visibility is inherited, so a parent\'s visibility: hidden hides children, but a child can override with visibility: visible. display: none cannot be overridden by children.' },

  // Intermediate
  { difficulty: 'intermediate', topic: 'Layout',
    q: 'When would you use Flexbox vs CSS Grid?',
    a: 'Flexbox is one-dimensional — it controls either a row OR a column. Use it for component-level layout: nav bars, button groups, centering a single element, aligning items along one axis. Grid is two-dimensional — it controls rows AND columns simultaneously. Use it for page-level layout, card grids, and overlapping elements. In practice: if you think in rows, use flex; if you need rows AND columns to align, use grid. Both can be nested.' },
  { difficulty: 'intermediate', topic: 'Layout',
    q: 'How does CSS sticky positioning work?',
    a: 'position: sticky makes an element behave like position: relative in normal flow until it reaches a scroll threshold (set with top, bottom, left, or right), then it acts like position: fixed within its scroll container. The element "sticks" until its parent scrolls out of view. Common gotchas: (1) The parent must be taller than the sticky element and must scroll. (2) An ancestor with overflow: hidden or overflow: auto breaks sticky because it creates a new scroll container.' },
  { difficulty: 'intermediate', topic: 'Cascade',
    q: 'What are CSS cascade layers (@layer) and why are they useful?',
    a: '@layer lets you explicitly control the priority of CSS rule groups independent of specificity. Rules in a later-declared layer always win over rules in an earlier layer, regardless of how specific they are. Unlayered styles beat all layered styles. Pattern: @layer reset, base, components, utilities. This eliminates specificity wars — library styles in a layer can never win over your utilities, even if they are more specific.' },
  { difficulty: 'intermediate', topic: 'Layout',
    q: 'Explain the CSS stacking context and how z-index works.',
    a: 'A stacking context is a group of elements rendered together in depth order. Elements with higher z-index appear in front within the SAME stacking context. New stacking contexts are created by: position + z-index (not auto), transform (not none), opacity < 1, filter, will-change, isolation: isolate, and more. z-index only compares within the same stacking context — a child with z-index: 9999 cannot escape its parent\'s stacking context.' },
  { difficulty: 'intermediate', topic: 'Responsive',
    q: 'What is the difference between responsive (media queries) and container queries?',
    a: 'Media queries respond to the viewport width — @media (min-width: 768px). They work at the page level, making it hard to reuse components in different contexts. Container queries (@container) respond to the element\'s containing block width — @container (min-width: 400px). This makes components truly context-independent: a card in a sidebar vs in a main area can each respond to their own available space. The container must have container-type: inline-size.' },
  { difficulty: 'intermediate', topic: 'Performance',
    q: 'Which CSS properties can be animated at 60fps without causing layout or paint?',
    a: 'transform (translate, rotate, scale, skew) and opacity are the two GPU-composited properties that run on the compositor thread — no layout or paint triggered. All other properties (width, height, top, left, background-color, font-size, etc.) cause at least paint and sometimes layout on every frame, risking frame drops. Use transform: translateX() instead of left:, and scale() instead of width:, for smooth animations.' },
  { difficulty: 'intermediate', topic: 'Modern CSS',
    q: 'How do CSS custom properties (variables) differ from preprocessor variables (Sass/Less)?',
    a: 'CSS custom properties are live at runtime and can be changed by JavaScript or by overriding in a child selector — they inherit through the DOM, are scoped to the declaration, and can be animated (with @property). Sass/Less variables are compile-time — they are replaced with static values at build time, cannot be overridden at runtime, and have no inheritance. Custom properties: --color: red; used as color: var(--color). Sass: $color: red; used as color: $color;' },

  // Advanced
  { difficulty: 'advanced', topic: 'Performance',
    q: 'What is a CSS compositing layer and how does it affect performance?',
    a: 'The browser splits page rendering into layers. A compositing layer runs independently on the GPU, separate from the main document. Elements promoted to their own layer (via transform, will-change: transform, opacity < 1) can be moved/transformed at 60fps without the browser re-painting the main layer. Downsides: each layer consumes GPU memory — promoting many elements degrades performance. will-change: transform is a hint to pre-promote; use it only on elements about to animate.' },
  { difficulty: 'advanced', topic: 'Modern CSS',
    q: 'What are scroll-driven animations and how do they differ from JavaScript scroll handlers?',
    a: 'Scroll-driven animations (animation-timeline: scroll() / view()) link @keyframes animation progress to scroll position rather than time. They run entirely on the compositor thread — no JS event listeners, no main-thread code, no jank even under heavy JS load. scroll() links to container scroll progress (0%=top, 100%=bottom); view() links to an element\'s visibility (entry/exit phases). Always add @supports not (animation-timeline: view()) fallback for unsupported browsers.' },
  { difficulty: 'advanced', topic: 'Cascade',
    q: 'How does the :has() selector interact with specificity?',
    a: ':has() takes the specificity of its argument: :has(.class) = (0,0,1,0), :has(#id) = (0,1,0,0). The element matched by :has() itself contributes its own specificity: .card:has(img) = (0,0,1,1). :has() is a forgiving relative selector — invalid selectors inside are silently ignored rather than invalidating the whole rule. It does not create an anchor for the selector — it only acts as a condition on the element being matched.' },
  { difficulty: 'advanced', topic: 'Modern CSS',
    q: 'What is the difference between filter: drop-shadow() and box-shadow?',
    a: 'box-shadow always follows the rectangular border-box, ignoring transparent areas. filter: drop-shadow() is a compositing filter that follows the actual visible pixel shape — correct for PNGs, SVGs, and non-rectangular elements. Drop-shadow syntax: drop-shadow(x y blur color) — there is NO spread radius (4th value of box-shadow). Both can be animated but filter: drop-shadow is more expensive on large elements.' },
  { difficulty: 'advanced', topic: 'Layout',
    q: 'How does CSS subgrid work and when would you use it?',
    a: 'grid-template-columns: subgrid / grid-template-rows: subgrid on a grid item makes its own children participate in the parent grid\'s track layout. Without subgrid, a grid item\'s children create their own independent grid — card headers cannot align across cards in different columns. With subgrid, children of different grid items share the same column/row tracks, enabling cross-item alignment. Use case: aligning card headings and footers across a card grid.' },
  { difficulty: 'advanced', topic: 'Performance',
    q: 'How do you manage specificity at scale in a large codebase?',
    a: 'Strategies: (1) Cascade layers — put reset, base, components, utilities in @layer order; later layers win over earlier regardless of specificity. (2) Low-specificity selectors — class selectors only, no IDs. (3) :where() for resets — zero specificity, trivially overridable. (4) CSS Modules — locally scoped class names, no global specificity leakage. (5) BEM naming — .block__element--modifier avoids nesting, keeping specificity at (0,0,1,0) consistently. The goal: flat specificity curve with @layer as the escalation mechanism.' },
];

const TOPICS = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];
const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced'] as const;

@Component({
  selector: 'app-css-interview-prep',
  standalone: true,
  imports: [],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class CssInterviewPrep {
  difficulty = signal<string>('All');
  topic = signal('All');
  expanded = signal<number | null>(null);

  topics = TOPICS;
  difficulties = DIFFICULTIES;

  filtered = computed(() => {
    const d = this.difficulty();
    const t = this.topic();
    return QUESTIONS.filter(q =>
      (d === 'All' || q.difficulty === d) &&
      (t === 'All' || q.topic === t)
    );
  });

  counts = computed(() => {
    const t = this.topic();
    return {
      all:          QUESTIONS.filter(q => t === 'All' || q.topic === t).length,
      beginner:     QUESTIONS.filter(q => q.difficulty === 'beginner'     && (t === 'All' || q.topic === t)).length,
      intermediate: QUESTIONS.filter(q => q.difficulty === 'intermediate' && (t === 'All' || q.topic === t)).length,
      advanced:     QUESTIONS.filter(q => q.difficulty === 'advanced'     && (t === 'All' || q.topic === t)).length,
    };
  });

  toggle(i: number) { this.expanded.update(v => v === i ? null : i); }
  setDifficulty(d: string) { this.difficulty.set(d); this.expanded.set(null); }
  setTopic(t: string) { this.topic.set(t); this.expanded.set(null); }

  diffLabel(d: string) {
    return d === 'beginner' ? 'Beginner' : d === 'intermediate' ? 'Intermediate' : d === 'advanced' ? 'Advanced' : d;
  }
}
