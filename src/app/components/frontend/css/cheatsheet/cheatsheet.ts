import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CheatEntry { label: string; value: string; note?: string; }
interface CheatSection { heading: string; entries: CheatEntry[]; }
interface CheatTab { id: string; label: string; sections: CheatSection[]; }

const TABS: CheatTab[] = [
  {
    id: 'selectors', label: 'Selectors',
    sections: [
      {
        heading: 'Basic Selectors',
        entries: [
          { label: '*',               value: 'Universal selector — matches every element',           note: '0 specificity' },
          { label: 'E',               value: 'Element type selector — all <E> elements',             note: '(0,0,0,1)' },
          { label: '.class',          value: 'Class selector',                                       note: '(0,0,1,0)' },
          { label: '#id',             value: 'ID selector',                                          note: '(0,1,0,0)' },
          { label: '[attr]',          value: 'Has attribute',                                        note: '(0,0,1,0)' },
          { label: '[attr="val"]',    value: 'Attribute equals value' },
          { label: '[attr^="val"]',   value: 'Attribute starts with' },
          { label: '[attr$="val"]',   value: 'Attribute ends with' },
          { label: '[attr*="val"]',   value: 'Attribute contains' },
        ],
      },
      {
        heading: 'Combinators',
        entries: [
          { label: 'A B',     value: 'Descendant — B anywhere inside A' },
          { label: 'A > B',   value: 'Direct child — B immediately inside A' },
          { label: 'A + B',   value: 'Adjacent sibling — B immediately after A' },
          { label: 'A ~ B',   value: 'General sibling — B after A, same parent' },
        ],
      },
      {
        heading: 'Pseudo-classes',
        entries: [
          { label: ':hover / :focus / :active',   value: 'User interaction states' },
          { label: ':focus-visible',              value: 'Keyboard focus only (not click)', note: 'Better than :focus for buttons' },
          { label: ':nth-child(n)',               value: 'nth element in parent (1-based)' },
          { label: ':nth-of-type(n)',             value: 'nth of same element type' },
          { label: ':first-child / :last-child',  value: 'First/last among siblings' },
          { label: ':not(selector)',              value: 'Negate — excludes matching elements', note: 'Specificity = arg' },
          { label: ':is(A, B, C)',                value: 'Forgiving list; specificity = highest arg' },
          { label: ':where(A, B)',                value: 'Like :is() but always 0 specificity' },
          { label: ':has(selector)',              value: 'Parent selector — matches if child exists', note: 'CSS4' },
          { label: ':checked / :disabled',        value: 'Form element states' },
          { label: ':empty',                      value: 'No children (including text nodes)' },
        ],
      },
      {
        heading: 'Pseudo-elements',
        entries: [
          { label: '::before / ::after',    value: 'Generated content (needs content: property)' },
          { label: '::placeholder',         value: 'Input placeholder text' },
          { label: '::selection',           value: 'Text selected by user' },
          { label: '::first-line',          value: 'First line of a block element' },
          { label: '::marker',              value: 'List item bullet/number' },
          { label: '::backdrop',            value: 'Fullscreen/dialog backdrop' },
        ],
      },
    ],
  },
  {
    id: 'box', label: 'Box Model',
    sections: [
      {
        heading: 'Box Sizing',
        entries: [
          { label: 'box-sizing: border-box',  value: 'width/height includes padding + border (use always)' },
          { label: 'box-sizing: content-box', value: 'Default — padding/border add to width (avoid)' },
        ],
      },
      {
        heading: 'Dimensions',
        entries: [
          { label: 'width / height',          value: 'Explicit size (px, %, rem, vw, vh, auto)' },
          { label: 'min-width / max-width',   value: 'Constraint bounds — max-width: 860px common for readable text' },
          { label: 'min-height / max-height', value: 'Height constraints' },
          { label: 'aspect-ratio: 16/9',      value: 'Maintain aspect ratio — replaces padding-top hack' },
        ],
      },
      {
        heading: 'Spacing',
        entries: [
          { label: 'margin: top right bottom left',   value: 'Outside space. margin: auto centers block elements' },
          { label: 'margin-inline / margin-block',    value: 'Logical: horizontal / vertical margin' },
          { label: 'padding: top right bottom left',  value: 'Inside space between content and border' },
          { label: 'padding-inline / padding-block',  value: 'Logical: horizontal / vertical padding' },
          { label: 'gap',                             value: 'Spacing between flex/grid items (replaces margin hacks)' },
        ],
      },
      {
        heading: 'Border & Overflow',
        entries: [
          { label: 'border: width style color',  value: 'border: 1px solid #e2e8f0' },
          { label: 'border-radius',              value: 'Rounded corners. border-radius: 50% = circle' },
          { label: 'outline',                    value: 'Like border but outside box, does not affect layout' },
          { label: 'overflow: hidden/scroll/auto', value: 'Content outside bounds: clip / force scroll / auto scroll' },
          { label: 'overflow-clip-margin',       value: 'Allow ink overflow beyond clip edge (for box-shadow)' },
        ],
      },
    ],
  },
  {
    id: 'layout', label: 'Layout',
    sections: [
      {
        heading: 'Flexbox Container',
        entries: [
          { label: 'display: flex',                value: 'Enable flex layout on container' },
          { label: 'flex-direction: row/column',   value: 'Main axis direction (default: row)' },
          { label: 'flex-wrap: wrap/nowrap',       value: 'Allow items to wrap to next line' },
          { label: 'justify-content',              value: 'Main axis alignment: flex-start, center, space-between, space-around, space-evenly' },
          { label: 'align-items',                  value: 'Cross axis alignment: flex-start, center, flex-end, stretch, baseline' },
          { label: 'align-content',                value: 'Cross axis line alignment (multi-line only)' },
          { label: 'gap: row col',                 value: 'Gutters between flex items' },
        ],
      },
      {
        heading: 'Flexbox Items',
        entries: [
          { label: 'flex: 1',           value: 'flex-grow:1 flex-shrink:1 flex-basis:0 — equal share' },
          { label: 'flex: 0 0 200px',   value: 'Fixed 200px — does not grow or shrink' },
          { label: 'flex-grow: n',      value: 'How much item grows relative to siblings' },
          { label: 'flex-shrink: n',    value: 'How much item shrinks when space is tight' },
          { label: 'align-self',        value: 'Override align-items for one item' },
          { label: 'order: n',          value: 'Reorder item (default: 0). Negative = move earlier' },
        ],
      },
      {
        heading: 'CSS Grid Container',
        entries: [
          { label: 'display: grid',                          value: 'Enable grid layout' },
          { label: 'grid-template-columns: 1fr 2fr 1fr',    value: 'Define column tracks' },
          { label: 'grid-template-rows: auto 1fr auto',      value: 'Define row tracks' },
          { label: 'repeat(3, 1fr)',                         value: 'Repeat 3 equal columns' },
          { label: 'repeat(auto-fill, minmax(200px, 1fr))',  value: 'Responsive columns — no media query' },
          { label: 'grid-template-areas',                    value: 'Named area layout: "header" "main sidebar" "footer"' },
          { label: 'gap: row col',                           value: 'Row and column gaps' },
        ],
      },
      {
        heading: 'CSS Grid Items',
        entries: [
          { label: 'grid-column: 1 / 3',   value: 'Span from column line 1 to 3' },
          { label: 'grid-column: span 2',   value: 'Span 2 column tracks' },
          { label: 'grid-area: header',     value: 'Assign to named area' },
          { label: 'place-self: center',    value: 'Shorthand for align-self + justify-self' },
        ],
      },
      {
        heading: 'Positioning',
        entries: [
          { label: 'position: static',   value: 'Default — normal flow, top/left/etc. have no effect' },
          { label: 'position: relative', value: 'Offset from normal position; creates stacking context' },
          { label: 'position: absolute', value: 'Relative to nearest positioned ancestor' },
          { label: 'position: fixed',    value: 'Relative to viewport, stays on scroll' },
          { label: 'position: sticky',   value: 'Normal flow until scroll threshold, then fixed-like' },
          { label: 'inset: 0',           value: 'Logical shorthand for top:0 right:0 bottom:0 left:0' },
          { label: 'z-index',            value: 'Stacking order within the same stacking context' },
        ],
      },
    ],
  },
  {
    id: 'typography', label: 'Typography',
    sections: [
      {
        heading: 'Font',
        entries: [
          { label: 'font-family',                    value: 'Font stack: "Inter", system-ui, sans-serif' },
          { label: 'font-size: clamp(1rem, 2vw, 1.5rem)', value: 'Fluid font size — min, preferred, max' },
          { label: 'font-weight: 100–900',           value: '400=normal, 700=bold. Variable fonts support decimals' },
          { label: 'font-style: italic/normal',      value: 'Italic or oblique text' },
          { label: 'font-display: swap',             value: '@font-face descriptor: show fallback while web font loads' },
          { label: 'font-variant-numeric: tabular-nums', value: 'Monospace numbers — aligned in tables' },
        ],
      },
      {
        heading: 'Text',
        entries: [
          { label: 'line-height: 1.5',        value: 'Unitless multiplier of font-size (recommended)' },
          { label: 'letter-spacing',           value: 'Space between characters (em units recommended)' },
          { label: 'text-align: left/center/right/justify', value: 'Horizontal alignment' },
          { label: 'text-transform: uppercase/lowercase/capitalize', value: 'Case transformation' },
          { label: 'text-decoration',          value: 'underline, overline, line-through, none' },
          { label: 'text-overflow: ellipsis',  value: 'Truncate overflow text. Needs overflow:hidden + white-space:nowrap' },
          { label: 'white-space: nowrap',      value: 'Prevent line wrap' },
          { label: 'word-break: break-word',   value: 'Break long words to prevent overflow' },
          { label: 'overflow-wrap: anywhere',  value: 'Break word anywhere to prevent overflow (more aggressive)' },
        ],
      },
    ],
  },
  {
    id: 'colors', label: 'Colors & Variables',
    sections: [
      {
        heading: 'Color Formats',
        entries: [
          { label: '#rrggbb / #rgb',         value: 'Hex — most common. #264de4, #fff' },
          { label: 'rgb(r g b) / rgb(r g b / a)', value: 'RGB. Modern syntax: rgb(38 77 228 / .8)' },
          { label: 'hsl(h s% l% / a)',       value: 'Hue (0-360) Saturation% Lightness%. Great for theming' },
          { label: 'oklch(L C H / a)',        value: 'Perceptually uniform — equal L values look equally bright' },
          { label: 'color-mix(in oklch, red 50%, blue)', value: 'Mix two colours in a given colour space' },
          { label: 'currentColor',            value: 'Inherits the element\'s color value — great for SVG fills' },
          { label: 'transparent',            value: 'rgba(0,0,0,0)' },
        ],
      },
      {
        heading: 'CSS Custom Properties',
        entries: [
          { label: '--name: value',            value: 'Define custom property. --color-primary: #264de4' },
          { label: 'var(--name)',              value: 'Use custom property' },
          { label: 'var(--name, fallback)',    value: 'With fallback if property undefined' },
          { label: ':root { --name: value }',  value: 'Global scope — available everywhere' },
          { label: '@property',                value: 'Register custom property with type — enables animation' },
        ],
      },
      {
        heading: 'Gradients',
        entries: [
          { label: 'linear-gradient(to right, #264de4, #9333ea)', value: 'Left-to-right gradient' },
          { label: 'radial-gradient(circle, #264de4, #9333ea)',   value: 'Circular radial gradient' },
          { label: 'conic-gradient(from 0deg, red, blue)',         value: 'Conic/pie chart gradient' },
        ],
      },
    ],
  },
  {
    id: 'animations', label: 'Animations',
    sections: [
      {
        heading: 'Transitions',
        entries: [
          { label: 'transition: property duration timing delay', value: 'transition: color .2s ease' },
          { label: 'transition: all .3s',   value: 'Avoid — transitions ALL properties (performance risk)' },
          { label: 'ease / linear / ease-in-out / cubic-bezier()', value: 'Timing functions' },
          { label: '@media (prefers-reduced-motion: reduce)', value: 'Always respect — disable/reduce animations' },
        ],
      },
      {
        heading: '@keyframes Animations',
        entries: [
          { label: '@keyframes name { from {} to {} }',     value: 'Define keyframes' },
          { label: 'animation: name duration timing',        value: 'animation: spin 1s linear infinite' },
          { label: 'animation-fill-mode: forwards',          value: 'Keep last keyframe state after animation ends' },
          { label: 'animation-iteration-count: infinite',    value: 'Loop forever' },
          { label: 'animation-direction: alternate',         value: 'Reverses on odd iterations (ping-pong)' },
          { label: 'animation-play-state: paused/running',   value: 'Pause/resume from JavaScript' },
        ],
      },
      {
        heading: 'Scroll-Driven Animations',
        entries: [
          { label: 'animation-timeline: scroll(root block)', value: 'Link animation to page scroll (progress bar)' },
          { label: 'animation-timeline: view()',             value: 'Link animation to element visibility (reveal)' },
          { label: 'animation-range: entry 0% entry 100%',  value: 'Play during element\'s entry phase' },
        ],
      },
      {
        heading: 'Transform',
        entries: [
          { label: 'transform: translate(x,y)',        value: 'Move without affecting layout' },
          { label: 'transform: rotate(deg)',            value: 'Rotate around Z axis' },
          { label: 'transform: scale(x, y)',            value: 'Scale element' },
          { label: 'translate / rotate / scale',        value: 'Individual CSS4 properties — compose independently' },
          { label: 'will-change: transform',            value: 'Pre-promote to GPU layer — use sparingly' },
        ],
      },
    ],
  },
  {
    id: 'modern', label: 'Modern CSS',
    sections: [
      {
        heading: 'Responsive',
        entries: [
          { label: '@media (min-width: 768px)',          value: 'Mobile-first breakpoint' },
          { label: 'clamp(min, preferred, max)',          value: 'Fluid value — font, spacing, width' },
          { label: 'min() / max()',                       value: 'min(50%, 400px) — picks the smaller value' },
          { label: '@container (min-width: 400px)',       value: 'Container query — responds to parent, not viewport' },
          { label: 'container-type: inline-size',         value: 'Required on container for @container to work' },
        ],
      },
      {
        heading: 'Cascade Layers',
        entries: [
          { label: '@layer reset, base, components, utilities', value: 'Declare layer order — later = higher priority' },
          { label: '@layer base { ... }',                value: 'Add rules to a named layer' },
          { label: '@import url() layer(name)',           value: 'Import external CSS into a layer' },
          { label: 'revert-layer',                       value: 'Roll back to the previous layer\'s value' },
        ],
      },
      {
        heading: 'CSS Nesting',
        entries: [
          { label: '.parent { .child {} }',       value: 'Native nesting — no preprocessor needed' },
          { label: '.card { & h2 {} }',           value: '& references the parent selector' },
          { label: '.btn { &:hover {} }',         value: 'Nested pseudo-class' },
          { label: '.card { @media { } }',        value: 'Nested @media query — context-aware breakpoint' },
        ],
      },
      {
        heading: 'Logical Properties',
        entries: [
          { label: 'margin-inline: auto',         value: 'Horizontal margin (RTL-aware)' },
          { label: 'padding-block: 1rem',         value: 'Vertical padding (RTL-aware)' },
          { label: 'inline-size / block-size',    value: 'RTL-aware width / height' },
          { label: 'inset-inline-start',          value: 'RTL-aware left (or right in RTL)' },
          { label: 'border-start-start-radius',   value: 'RTL-aware border-top-left-radius' },
        ],
      },
    ],
  },
];

@Component({
  selector: 'app-css-cheatsheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class CssCheatsheet {
  activeTab = signal('selectors');
  search = signal('');

  tabs = TABS;

  currentTab = computed(() => TABS.find(t => t.id === this.activeTab()) ?? TABS[0]);

  filteredSections = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.currentTab().sections;
    return this.currentTab().sections
      .map(s => ({
        ...s,
        entries: s.entries.filter(e =>
          e.label.toLowerCase().includes(q) ||
          e.value.toLowerCase().includes(q) ||
          (e.note ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.entries.length > 0);
  });

  setTab(id: string) { this.activeTab.set(id); this.search.set(''); }
  onSearch(val: string) { this.search.set(val); }
}
