import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Layout': 'layout', 'Visual': 'visual',
  'Responsive': 'responsive', 'Animation': 'animation', 'Modern CSS': 'modern', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Layout', 'Visual', 'Responsive', 'Animation', 'Modern CSS', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'CSS Fundamentals',           route: '/css', badge: 'Foundations', available: false,
    description: 'Selectors, the cascade, specificity, inheritance, and how the browser calculates styles.',
    keyPoints: ['Specificity: inline > id > class/attribute/pseudo-class > element', 'Cascade order: importance → specificity → source order', '!important overrides all; avoid except for utility classes and resets'] },
  { title: 'Box Model',                  route: '/css/box-model', badge: 'Foundations', available: true,
    description: 'Content, padding, border, margin — box-sizing: border-box and why it changed everything.',
    keyPoints: ['border-box: width includes padding and border — use everywhere via *', 'Margin collapse: adjacent block margins collapse to the larger value', 'Negative margins: valid, pulls elements together or outside their container'] },
  { title: 'Selectors Deep Dive',        route: '/css', badge: 'Foundations', available: false,
    description: 'Combinators, pseudo-classes, pseudo-elements, attribute selectors, :is(), :where(), :has().',
    keyPoints: [':is() and :where() take a forgiving selector list — invalid selectors are ignored', ':has() is CSS\'s parent selector — "card:has(img)" selects cards containing images', ':where() has zero specificity — good for resets and defaults'] },
  { title: 'CSS Custom Properties',      route: '/css', badge: 'Foundations', available: false,
    description: 'CSS variables, scope, inheritance, fallbacks, and using them for design tokens and theming.',
    keyPoints: ['--my-var: value; defined on :root for global scope', 'var(--my-var, fallback) — fallback if variable is undefined', 'Custom properties cascade and inherit — override at component scope'] },
  { title: 'Flexbox',                    route: '/css/flexbox', badge: 'Layout', available: true,
    description: 'One-dimensional layout — flex container and item properties, alignment, wrapping, and reordering.',
    keyPoints: ['flex: 1 = flex-grow:1, flex-shrink:1, flex-basis:0% — equal share of space', 'justify-content: main axis; align-items: cross axis', 'gap replaces margin hacks for consistent gutter between flex items'] },
  { title: 'CSS Grid',                   route: '/css/grid', badge: 'Layout', available: true,
    description: 'Two-dimensional layout — explicit and implicit grids, template areas, auto-placement, and subgrid.',
    keyPoints: ['grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) — responsive without media queries', 'grid-area: spans a named template area; grid-column/row for explicit placement', 'subgrid: lets children align to the parent grid — solves card header alignment'] },
  { title: 'Positioning & Stacking',     route: '/css', badge: 'Layout', available: false,
    description: 'Static, relative, absolute, fixed, sticky positioning — stacking context and z-index.',
    keyPoints: ['Absolute: relative to nearest positioned ancestor (position ≠ static)', 'Sticky: normal flow until scroll threshold, then acts like fixed within container', 'Stacking context: created by transform, opacity < 1, z-index on positioned elements'] },
  { title: 'Typography',                 route: '/css', badge: 'Visual', available: false,
    description: 'Font loading, variable fonts, system font stack, fluid typography, and text rendering.',
    keyPoints: ['font-display: swap: text visible immediately with fallback font', 'clamp(1rem, 2.5vw, 1.5rem): fluid font size without media queries', 'Variable fonts: one file, many axes (weight, width, slant)'] },
  { title: 'Colors & Theming',           route: '/css', badge: 'Visual', available: false,
    description: 'Color spaces (oklch, hsl, rgb), color functions, dark mode strategies, and accessible contrast.',
    keyPoints: ['oklch: perceptually uniform — equal lightness values look equally bright', 'prefers-color-scheme: media query for system dark mode preference', 'color-mix(): mix two colors in a given color space — CSS-native tinting'] },
  { title: 'Backgrounds & Borders',      route: '/css', badge: 'Visual', available: false,
    description: 'Background image, gradients, background-size, multiple backgrounds, border-radius, box-shadow.',
    keyPoints: ['aspect-ratio: 16/9 maintains ratio without padding-top hack', 'object-fit: cover/contain for img inside fixed-size container', 'box-shadow: multiple values stacked for layered, smooth shadows'] },
  { title: 'Responsive Design',          route: '/css', badge: 'Responsive', available: false,
    description: 'Mobile-first methodology, media queries, fluid grids, and responsive images.',
    keyPoints: ['Mobile-first: start with small screen styles, add complexity with min-width queries', 'clamp() and min()/max() for fluid sizing without breakpoints', 'Container queries: @container — respond to element width, not viewport'] },
  { title: 'Container Queries',          route: '/css', badge: 'Responsive', available: false,
    description: 'Component-scoped responsiveness — @container queries respond to element width instead of viewport.',
    keyPoints: ['container-type: inline-size on parent; @container (min-width: 500px) on children', 'Container queries unlock truly reusable components independent of their context', 'Container query units: cqw, cqh — percentage of container dimensions'] },
  { title: 'CSS Transitions',            route: '/css', badge: 'Animation', available: false,
    description: 'Transition property, duration, timing function, and delay — performant transitions on CSS properties.',
    keyPoints: ['Only transition transform and opacity for 60fps (no layout/paint)', 'transition: all .3s is a performance anti-pattern — be specific', 'prefers-reduced-motion media query — always respect user preference'] },
  { title: 'CSS Animations',             route: '/css', badge: 'Animation', available: false,
    description: '@keyframes, animation shorthand, timing functions, fill-mode, iteration, and the Web Animations API.',
    keyPoints: ['will-change: transform hints the browser to promote element to its own layer', 'animation-fill-mode: forwards — keeps last keyframe state after animation ends', 'Web Animations API: control animations from JavaScript (play, pause, reverse)'] },
  { title: 'CSS Layers (@layer)',         route: '/css', badge: 'Modern CSS', available: false,
    description: 'Cascade layers control specificity without specificity wars — order layers instead of fighting selectors.',
    keyPoints: ['@layer base, components, utilities — lower layers have lower priority', 'Unlayered styles beat all layered styles regardless of specificity', 'Libraries in a layer: third-party styles never win over your utilities'] },
  { title: 'CSS Nesting',                route: '/css', badge: 'Modern CSS', available: false,
    description: 'Native CSS nesting (without preprocessors) — & parent selector, nested media queries.',
    keyPoints: ['& refers to the parent selector in native nesting', '.card { & h3 { } } is equivalent to .card h3 {}', 'Nested @media queries: context-aware breakpoints alongside the component styles'] },
  { title: 'Logical Properties',         route: '/css', badge: 'Modern CSS', available: false,
    description: 'margin-inline, padding-block, inset — write CSS that works for LTR and RTL without overrides.',
    keyPoints: ['margin-inline: horizontal margin; margin-block: vertical margin', 'Automatically flips for RTL languages — no dir="rtl" overrides needed', 'border-start-start-radius: equivalent of border-top-left-radius in LTR'] },
  { title: 'CSS Architecture (BEM/ITCSS)', route: '/css', badge: 'Modern CSS', available: false,
    description: 'BEM naming, ITCSS layers, CSS Modules, utility-first (Tailwind) — methodologies for maintainable CSS.',
    keyPoints: ['BEM: .block__element--modifier — eliminates specificity battles', 'ITCSS: Settings → Tools → Generic → Elements → Objects → Components → Utilities', 'CSS Modules: locally scoped class names — zero collision guarantee'] },
  { title: 'Tailwind CSS',               route: '/css', badge: 'Modern CSS', available: false,
    description: 'Utility-first CSS framework — apply pre-built classes directly in HTML, no custom CSS needed.',
    keyPoints: ['Utility classes: flex, p-4, text-xl, bg-blue-500 composable in markup', 'JIT mode: only generates CSS for classes used — tiny production bundle', 'tailwind.config.ts: extend theme (colors, fonts, spacing) or add custom utilities', 'Dark mode: class strategy (dark:bg-gray-900) vs media strategy', 'Combine with cn()/clsx for conditional class application in React/Angular'] },
  { title: 'Scroll-Driven Animations',   route: '/css', badge: 'Modern CSS', available: false,
    description: 'Native CSS scroll-linked animations — animation-timeline: scroll() and view() without JavaScript.',
    keyPoints: ['animation-timeline: scroll() — links animation to scroll position', 'animation-timeline: view() — links to element\'s visibility in viewport', 'animation-range: entry 0% exit 100% controls start/end of the animation', 'No IntersectionObserver needed for reveal-on-scroll effects', 'Supported in Chrome 115+ / Firefox 110+ — progressive enhancement'] },
  { title: 'CSS Cheat Sheet',            route: '/css', badge: 'Reference', available: false,
    description: 'Quick-reference for Flexbox, Grid, positioning, selectors, and animation properties.',
    keyPoints: ['Flexbox alignment matrix at a glance', 'Grid template syntax: repeat(), minmax(), auto-fill vs auto-fit', 'Common selector patterns with specificity weight'] },
  { title: 'CSS Interview Prep',         route: '/css', badge: 'Reference', available: false,
    description: '30+ CSS interview questions — specificity, box model, Flexbox vs Grid, performance, and modern CSS.',
    keyPoints: ['Explain the cascade and specificity calculation', 'When would you use Grid vs Flexbox?', 'How does z-index and stacking context work?'] },
];

@Component({
  selector: 'app-css-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class CssHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
