import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-group-sequence-parallel-orchestration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './group-sequence-parallel-orchestration.html',
  styleUrl: './group-sequence-parallel-orchestration.scss',
})
export class GroupSequenceParallelOrchestrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'sequence() — animations that run one after another',
      points: [
        '<code>sequence([animate(\'200ms\', style({opacity: 0})), animate(\'300ms\', style({transform: \'scale(1.2)\'}))])</code> runs each inner <code>animate()</code> call ONE AFTER THE OTHER — the second step does not start until the first has fully completed. This is the DEFAULT behavior inside an <code>animate()</code> array passed directly to <code>transition()</code> too; <code>sequence()</code> makes it explicit when nesting inside a <code>group()</code>.',
      ],
    },
    {
      heading: 'group() — animations that run simultaneously, on independent timelines',
      points: [
        '<code>group([animate(\'300ms\', style({opacity: 1})), animate(\'500ms\', style({transform: \'translateX(0)\'}))])</code> starts ALL inner animations AT THE SAME TIME, each with its OWN independent duration/easing — the group as a whole finishes when its LONGEST child animation finishes (500ms here), not when the shortest one does.',
        'This is genuinely different from just listing two style changes in ONE <code>animate()</code> call — a single <code>animate()</code> applies ONE timing function to ALL its style changes together, while <code>group()</code> lets each property animate with its OWN distinct duration and easing curve simultaneously.',
      ],
    },
    {
      heading: 'Nesting group() and sequence() for real choreography',
      points: [
        '<code>group([sequence([...]), animate(\'400ms\', ...)])</code> composes both: one branch runs its own internal SEQUENCE of steps, while running in PARALLEL with a separate simple animation — this is how a genuinely choreographed page transition (fade out old content, THEN slide in new content, while a progress bar animates independently across the whole thing) is expressed.',
        'The route-animation pattern from the main topic page — <code>group([query(\':enter\', [...]), query(\':leave\', [...])])</code> — is exactly this primitive applied to enter/leave: BOTH the entering and leaving page animate simultaneously (a crossfade), rather than the leaving page fully disappearing before the entering page begins (which <code>sequence()</code> would produce instead).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { trigger, transition, style, animate, group, sequence } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  animations: [
    trigger('sequenceDemo', [
      transition('* => go', sequence([
        animate('300ms', style({ opacity: 0 })),
        animate('300ms', style({ transform: 'scale(1.3)' })),
        animate('300ms', style({ opacity: 1, transform: 'scale(1)' })),
      ])),
    ]),
    trigger('groupDemo', [
      transition('* => go', group([
        animate('300ms', style({ opacity: 1 })),
        animate('900ms ease-out', style({ transform: 'translateX(200px)' })),
      ])),
    ]),
  ],
  template: \`
    <h3>sequence() — three 300ms steps, one after another (~900ms total)</h3>
    <button (click)="runSequence()">Run sequence</button>
    <div [@sequenceDemo]="seqState()" style="width: 60px; height: 60px; background: #6366f1; margin-top: 0.5rem;"></div>

    <h3>group() — opacity (300ms) and translateX (900ms) run in PARALLEL</h3>
    <button (click)="runGroup()">Run group</button>
    <div [@groupDemo]="groupState()" style="width: 60px; height: 60px; background: #22c55e; margin-top: 0.5rem;"></div>
  \`,
})
export class App {
  seqState = signal('idle');
  groupState = signal('idle');

  runSequence() {
    this.seqState.set('idle');
    setTimeout(() => this.seqState.set('go'), 0);
  }

  runGroup() {
    this.groupState.set('idle');
    setTimeout(() => this.groupState.set('go'), 0);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>group vs sequence orchestration</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the group() animation\'s translateX duration from 900ms to 300ms (matching the opacity duration), and observe both properties now finish at the same time.',
    hint: 'Change animate(\'900ms ease-out\', style({ transform: \'translateX(200px)\' })) to animate(\'300ms ease-out\', ...) — now both group members share the same 300ms duration.',
    solution: `trigger('groupDemo', [
  transition('* => go', group([
    animate('300ms', style({ opacity: 1 })),
    animate('300ms ease-out', style({ transform: 'translateX(200px)' })),
  ])),
]),`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'group() and putting multiple style changes in one animate() call produce the same visual result.',
      reality: 'a single animate() call applies ONE shared timing function to all its style changes together — group() lets each inner animation have its OWN independent duration and easing curve, running genuinely in parallel rather than under one uniform timing.',
    },
    {
      thought: 'the steps inside a plain animate() array (without sequence() or group()) run in parallel by default.',
      reality: 'sequential execution is the DEFAULT for an animate() array passed to transition() — sequence() makes this explicit specifically when nesting inside a group(), where you need to mix sequential and parallel branches.',
    },
    {
      thought: 'a group() finishes as soon as its FASTEST inner animation completes.',
      reality: 'a group() as a whole finishes when its SLOWEST (longest-duration) inner animation completes — all branches run to their own completion, and the group waits for the last one.',
    },
  ];
}
