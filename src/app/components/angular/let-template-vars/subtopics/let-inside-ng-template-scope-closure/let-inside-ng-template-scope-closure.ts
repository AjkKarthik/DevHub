import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-let-inside-ng-template-scope-closure-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './let-inside-ng-template-scope-closure.html',
  styleUrl: './let-inside-ng-template-scope-closure.scss',
})
export class LetInsideNgTemplateScopeClosureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA claim in practice: outer @let is visible inside a nested ng-template',
      points: [
        'The main topic\'s QnA states this in one sentence without a worked example: "A @let from the outer template is accessible inside a nested &lt;ng-template&gt; because inner templates close over the outer scope." This subtopic builds the concrete case — an outer <code>@let</code> declared in the component\'s main template, referenced from INSIDE an <code>&lt;ng-template&gt;</code> that is later rendered via <code>*ngTemplateOutlet</code> or <code>NgTemplateOutlet</code>\'s <code>&lt;ng-container&gt;</code>.',
        'This closure behavior mirrors ordinary JavaScript closures: a function defined inside another function can read the outer function\'s variables. An <code>&lt;ng-template&gt;</code> block defined lexically INSIDE the scope of an outer <code>@let</code> can read that <code>@let</code>, exactly as a nested arrow function reads a variable from its enclosing scope.',
      ],
    },
    {
      heading: 'The template MUST be lexically nested — where it is RENDERED does not matter',
      points: [
        'The closure rule is about where the <code>&lt;ng-template&gt;</code> is WRITTEN in the source, not where it ends up being rendered via <code>*ngTemplateOutlet</code>. An <code>&lt;ng-template&gt;</code> declared inside the scope of an outer <code>@let</code> can reference it, even if that template is later projected and RENDERED somewhere else entirely (e.g. passed as content to a child component and rendered inside that child\'s own template) — the closure is fixed at the point of DECLARATION.',
        'Conversely, an <code>&lt;ng-template&gt;</code> declared OUTSIDE the scope of a particular <code>@let</code> (e.g. as a sibling at the root of the component template, while the <code>@let</code> is declared inside an <code>@if</code> block) cannot reference that <code>@let</code> — this is the SAME block-scoping rule from the main topic\'s common mistakes, just applied to the <code>&lt;ng-template&gt;</code> boundary instead of an <code>@if</code>/<code>@for</code> boundary.',
      ],
    },
    {
      heading: 'A structural-directive-style context: @let inside a custom directive\'s embedded template',
      points: [
        'When you write your OWN structural directive (using <code>TemplateRef</code> and <code>ViewContainerRef.createEmbeddedView()</code>), the CONSUMER\'S template content — wherever it declares <code>@let</code> — behaves identically: any <code>@let</code> the consumer writes inside the structural directive\'s content is scoped to THAT content block, closing over whatever outer <code>@let</code>s exist at the point the consumer wrote their template, completely independent of your directive\'s own internal implementation.',
        'This means your custom structural directive does not need to do anything special to "support" <code>@let</code> — it is purely a template-compilation-time feature that works transparently regardless of which directive ultimately instantiates the embedded view at runtime.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/nested-template.ts',
      content: `import { Component, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-nested-template',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: \`
    @let user = currentUser();
    @let greeting = 'Hello, ' + user.name + '!';

    <!-- This ng-template is declared HERE, inside the scope of 'user' and 'greeting' -->
    <ng-template #userCard>
      <div class="card">
        <!-- Closes over the OUTER @let declarations, even though this
             template is only actually RENDERED later, via the outlet below -->
        <h3>{{ greeting }}</h3>
        <p>Role: {{ user.role }}</p>
      </div>
    </ng-template>

    <p>Rendered via ngTemplateOutlet below:</p>
    <ng-container [ngTemplateOutlet]="userCard" />

    <button (click)="switchUser()">Switch user</button>
  \`,
})
export class NestedTemplateComponent {
  currentUser = signal({ name: 'Ada', role: 'admin' });

  switchUser() {
    this.currentUser.set({ name: 'Grace', role: 'editor' });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { NestedTemplateComponent } from './nested-template';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NestedTemplateComponent],
  template: \`
    <h3>@let inside ng-template — scope closure</h3>
    <p>The card's greeting and role come from @let variables declared OUTSIDE the
    ng-template, but the ng-template's content can still read them — because it
    closes over that outer scope. Click "Switch user" to see both update together.</p>
    <app-nested-template />
  \`,
})
export class App {}
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
  <head><title>@let inside ng-template — scope closure</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Move the "greeting" @let declaration to be declared INSIDE the ng-template instead of outside it, and confirm "user" is still accessible (since the ng-template is still nested inside user\'s scope) while greeting is now scoped ONLY to the template.',
    hint: 'Cut `@let greeting = ...;` from the outer scope and paste it as the first line inside <ng-template #userCard>, right before the <div class="card">.',
    solution: `@let user = currentUser();

<ng-template #userCard>
  @let greeting = 'Hello, ' + user.name + '!';  <!-- now declared INSIDE the template -->
  <div class="card">
    <h3>{{ greeting }}</h3>
    <p>Role: {{ user.role }}</p>
  </div>
</ng-template>

<!-- 'greeting' is now scoped only to userCard's content — if you tried to
     reference greeting outside the ng-template, it would be a compile error,
     exactly like referencing a @let declared inside @if from outside it. -->`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an ng-template can only access a @let variable if the template is actually RENDERED at the point where the @let was declared.',
      reality: 'the closure is determined by where the ng-template is WRITTEN (lexically nested inside the @let\'s scope), not where it is later rendered via ngTemplateOutlet — it can be projected and rendered somewhere else entirely and still read the outer @let.',
    },
    {
      thought: 'a custom structural directive needs special code to support consumers using @let inside its content.',
      reality: '@let is a template-compilation-time feature — a custom structural directive using TemplateRef and createEmbeddedView() works transparently with any @let a consumer declares inside its content, with no special handling required.',
    },
    {
      thought: 'the block-scoping rule for @let only applies to @if/@for/@switch blocks, not to ng-template boundaries.',
      reality: 'the exact same rule applies to ng-template — a @let declared OUTSIDE an ng-template\'s content is not automatically visible inside it unless the ng-template is lexically nested within that @let\'s scope.',
    },
  ];
}
