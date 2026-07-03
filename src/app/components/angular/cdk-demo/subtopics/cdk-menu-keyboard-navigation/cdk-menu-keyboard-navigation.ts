import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cdk-menu-keyboard-navigation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cdk-menu-keyboard-navigation.html',
  styleUrl: './cdk-menu-keyboard-navigation.scss',
})
export class CdkMenuKeyboardNavigationSubtopic {

  cdkDeps = { '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: '@angular/cdk/menu — behavior without a single visual opinion',
      points: [
        '<code>CdkMenuTrigger</code> (on a button), <code>CdkMenu</code> (the container), and <code>CdkMenuItem</code> (each option) together implement a fully WAI-ARIA-compliant menu — arrow-key navigation, typeahead, and focus management all come free, with ZERO built-in visual styling to override.',
        'This is a genuinely different module from <code>MatMenu</code> (Angular Material) — CDK Menu gives you only the interaction/accessibility behavior; every pixel of appearance is yours to style, unlike Material\'s prebuilt look.',
      ],
    },
    {
      heading: 'Keyboard behavior that comes for free',
      points: [
        'Once wired up, <code>CdkMenu</code> automatically handles: <kbd>↓</kbd>/<kbd>↑</kbd> to move between items, <kbd>Home</kbd>/<kbd>End</kbd> to jump to the first/last item, <kbd>Esc</kbd> to close and return focus to the trigger, and TYPEAHEAD (typing "s" jumps to the next item starting with "s") — none of this is code you write yourself.',
        'Nested menus (a menu item that itself opens a submenu) are supported via <code>[cdkMenuTriggerFor]</code> on a <code>CdkMenuItem</code> — <kbd>→</kbd> opens the submenu and moves focus into it, <kbd>←</kbd> closes it and returns focus to the parent item, matching standard OS-level menu conventions automatically.',
      ],
    },
    {
      heading: 'Wiring it up',
      points: [
        'Minimal structure: <code>&lt;button [cdkMenuTriggerFor]="menu"&gt;Options&lt;/button&gt; &lt;ng-template #menu&gt;&lt;div cdkMenu&gt;&lt;button cdkMenuItem (cdkMenuItemTriggered)="onAction()"&gt;Action&lt;/button&gt;&lt;/div&gt;&lt;/ng-template&gt;</code> — the menu content lives in an <code>&lt;ng-template&gt;</code>, only instantiated when opened.',
        '<code>cdkMenuItemTriggered</code> fires on both a click AND an Enter/Space keypress on a focused item — a single event handler covers both interaction modes without you writing separate keydown logic.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { CdkMenuModule } from '@angular/cdk/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CdkMenuModule],
  template: \`
    <h3>CDK Menu — try arrow keys, Home/End, Esc, and typeahead (type a letter)</h3>
    <button [cdkMenuTriggerFor]="menu" style="padding: 0.5rem 1rem;">
      File menu
    </button>

    <ng-template #menu>
      <div cdkMenu style="border: 1px solid #ccc; background: white; padding: 0.25rem; min-width: 160px;">
        <button cdkMenuItem (cdkMenuItemTriggered)="log('New')" style="display: block; width: 100%; text-align: left; padding: 0.5rem;">New</button>
        <button cdkMenuItem (cdkMenuItemTriggered)="log('Open')" style="display: block; width: 100%; text-align: left; padding: 0.5rem;">Open</button>
        <button cdkMenuItem (cdkMenuItemTriggered)="log('Save')" style="display: block; width: 100%; text-align: left; padding: 0.5rem;">Save</button>
        <button cdkMenuItem (cdkMenuItemTriggered)="log('Settings')" style="display: block; width: 100%; text-align: left; padding: 0.5rem;">Settings</button>
      </div>
    </ng-template>

    <p>Last action: {{ lastAction() }}</p>
  \`,
})
export class App {
  lastAction = signal('(none yet)');
  log(action: string) { this.lastAction.set(action); }
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
  <head><title>CDK Menu keyboard navigation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fifth menu item, "Exit", and verify typeahead (typing "e") now jumps directly to it since it is the only item starting with "e".',
    hint: 'Add another <button cdkMenuItem (cdkMenuItemTriggered)="log(\'Exit\')" ...>Exit</button> as a sibling of the existing four menu items inside the cdkMenu div.',
    solution: `<button cdkMenuItem (cdkMenuItemTriggered)="log('Exit')" style="display: block; width: 100%; text-align: left; padding: 0.5rem;">Exit</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CdkMenu and MatMenu are basically the same thing, just imported from different packages.',
      reality: 'CdkMenu provides ONLY behavior and accessibility (keyboard nav, focus, ARIA) with zero visual styling — MatMenu is Material\'s fully-styled component built ON TOP of similar underlying primitives; choose CdkMenu specifically when you need full design freedom.',
    },
    {
      thought: 'arrow-key navigation, Home/End, and typeahead in a CDK menu require you to write keydown event handlers.',
      reality: 'all of that keyboard behavior is built into CdkMenu/CdkMenuItem automatically once the directives are wired up — no keydown handling code is needed from you.',
    },
    {
      thought: 'cdkMenuItemTriggered only fires on a mouse click, so keyboard activation (Enter/Space) needs a separate handler.',
      reality: 'cdkMenuItemTriggered fires for BOTH click and Enter/Space keyboard activation on a focused item — one handler correctly covers both interaction modes.',
    },
  ];
}
