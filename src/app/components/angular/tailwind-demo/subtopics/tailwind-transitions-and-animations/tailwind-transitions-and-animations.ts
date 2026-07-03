import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-tailwind-transitions-and-animations-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './tailwind-transitions-and-animations.html',
  styleUrl: './tailwind-transitions-and-animations.scss',
})
export class TailwindTransitionsAndAnimationsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Built-in transition utilities — pure CSS, driven by a class toggle',
      points: [
        '<code>transition-colors duration-300 ease-in-out</code> declares WHICH properties animate (<code>transition-colors</code> = background/border/text color only; <code>transition-all</code> = everything, generally AVOID for performance), how long (<code>duration-300</code> = 300ms), and the easing curve — combine with a state class toggle like <code>[class.opacity-0]="!visible()"</code> and the CSS transition handles the rest, no Angular Animations package involved.',
        'This is exactly the "CSS-only" approach discussed in the Angular Animations topic\'s alternatives subtopic — Tailwind\'s transition utilities are just ergonomic shorthand for writing the same plain CSS <code>transition</code> property, still requiring zero JavaScript animation code.',
      ],
    },
    {
      heading: 'Built-in animation utilities — animate-spin, animate-pulse, animate-bounce',
      points: [
        '<code>animate-spin</code> (continuous rotation, for loading spinners), <code>animate-pulse</code> (opacity fade in/out, for skeleton loading placeholders), <code>animate-bounce</code> (vertical bounce, for "scroll down" indicators), and <code>animate-ping</code> (expanding ripple, for notification badges) are pre-built <code>&#64;keyframes</code> + <code>animation</code> shorthand utilities — apply the class, get the animation, no custom CSS needed.',
        'These are DECORATIVE, indefinitely-looping animations — genuinely different from the state-driven transitions above. A transition responds to a state CHANGE (open/closed, visible/hidden); these animation utilities loop CONTINUOUSLY as long as the class is applied, regardless of any application state.',
      ],
    },
    {
      heading: 'Custom keyframe animations via @theme',
      points: [
        'Tailwind v4 lets you register custom animations the SAME way as color/spacing tokens: <code>&#64;theme { --animate-fade-in-up: fade-in-up 0.5s ease-out; } &#64;keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }</code> — this generates a NEW utility class, <code>animate-fade-in-up</code>, usable exactly like the built-in <code>animate-spin</code>.',
        'Combine a custom entrance animation with Angular\'s <code>&#64;if</code>: applying <code>class="animate-fade-in-up"</code> to an element that <code>&#64;if</code> just inserted plays the animation automatically on insertion, since a freshly-mounted element always starts its CSS animation from the beginning — no <code>:enter</code> trigger or lifecycle wiring needed for this simple case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>State-driven transition — toggle visibility with a class</h3>
    <button (click)="visible.set(!visible())">Toggle</button>
    <div
      class="mt-2 transition-all duration-300 ease-in-out"
      [class.opacity-0]="!visible()"
      [class.opacity-100]="visible()"
      [class.scale-95]="!visible()"
      [class.scale-100]="visible()">
      <div class="bg-indigo-600 text-white p-4 rounded-lg">Fades and scales via CSS transition</div>
    </div>

    <h3>Built-in looping animation utilities</h3>
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <div class="animate-pulse bg-gray-300 h-8 w-24 rounded"></div>
      <div class="animate-bounce h-6 w-6 bg-green-600 rounded-full"></div>
    </div>

    <h3>&#64;if-inserted element with a custom entrance animation class</h3>
    <button (click)="showCard.set(!showCard())">Toggle card</button>
    @if (showCard()) {
      <div class="custom-fade-in mt-2 bg-green-600 text-white p-4 rounded-lg">
        Freshly inserted — plays its entrance animation automatically
      </div>
    }
  \`,
})
export class App {
  visible = signal(true);
  showCard = signal(false);
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Tailwind transitions and animations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Approximates a v4 @theme custom animation token for this CDN-based demo */
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .custom-fade-in { animation: fade-in-up 0.5s ease-out; }
    </style>
  </head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the fade/scale transition duration from 300ms to 700ms, and observe the toggle animation becomes noticeably slower.',
    hint: 'Change duration-300 to duration-700 in the class list on the transitioning div.',
    solution: `<div
  class="mt-2 transition-all duration-700 ease-in-out"
  ...>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Tailwind\'s built-in animate-spin/animate-pulse/animate-bounce utilities work the same way as a transition-based state toggle.',
      reality: 'they are decorative, INDEFINITELY LOOPING animations that run continuously as long as the class is applied — genuinely different from a transition, which only animates in response to a state CHANGE.',
    },
    {
      thought: 'transition-all is always the safest choice since it covers every property.',
      reality: 'it is a real performance concern — animating properties you don\'t actually need to (like width/height, which trigger layout) is expensive; specify the exact property family (transition-colors, transition-transform, transition-opacity) whenever possible.',
    },
    {
      thought: 'playing a custom entrance animation on an @if-inserted element requires Angular\'s :enter animation trigger.',
      reality: 'for a simple "play once on insertion" case, a plain CSS animation class applied to the element is enough — a freshly-mounted element always starts its CSS animation from the beginning automatically, no :enter trigger needed.',
    },
  ];
}
