import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-recursive-templates-ngtemplateoutlet-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './recursive-templates-ngtemplateoutlet.html',
  styleUrl: './recursive-templates-ngtemplateoutlet.scss',
})
export class RecursiveTemplatesNgtemplateoutletSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A template referencing itself',
      points: [
        'An <code>&lt;ng-template #node&gt;</code> can render <code>*ngTemplateOutlet</code> pointing back to ITSELF, INSIDE its own content — this is how a genuinely recursive structure (nested comments, a file tree, an org chart) renders with a single reusable template, no matter how deep the nesting goes.',
        'The recursive call passes a NEW context for each level — typically the current node\'s <code>children</code> array — so each recursive instantiation renders one level deeper with its own data, terminating naturally when a node has no children left.',
        'This is a component-free technique — no separate recursive COMPONENT is required. A single template fragment, referenced via a template reference variable, is enough to describe arbitrarily deep recursive structures.',
      ],
    },
    {
      heading: 'Practical structure and termination',
      points: [
        'Structure: <code>&lt;ng-template #node let-item&gt;&lt;div&gt;{{ item.name }}&lt;/div&gt; &#64;for (child of item.children; track child.id) { &lt;ng-container *ngTemplateOutlet="node; context: { $implicit: child }" /&gt; } &lt;/ng-template&gt;</code> — the template renders the current item, then loops its children, re-invoking itself for each one.',
        'Termination is IMPLICIT — a node with an empty (or absent) <code>children</code> array simply produces zero <code>&#64;for</code> iterations, stopping the recursion naturally at leaf nodes. There is no explicit base-case check required, unlike a recursive function.',
        'Wrap the recursive <code>*ngTemplateOutlet</code> call in an <code>&lt;ng-container&gt;</code> (not a <code>&lt;div&gt;</code>) to avoid emitting an extra wrapper element per recursion level, which would otherwise distort indentation-based styling (e.g. a file-tree\'s nested padding).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

const fileTree: TreeNode = {
  name: 'src',
  children: [
    {
      name: 'app',
      children: [
        { name: 'app.ts' },
        {
          name: 'components',
          children: [
            { name: 'header.ts' },
            { name: 'footer.ts' },
          ],
        },
      ],
    },
    { name: 'main.ts' },
    { name: 'index.html' },
  ],
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: \`
    <h3>Recursive file tree — one template, arbitrary depth</h3>

    <ng-template #node let-item let-depth="depth">
      <div [style.paddingLeft.px]="depth * 20">
        {{ item.children ? '📁' : '📄' }} {{ item.name }}
      </div>
      @for (child of item.children; track child.name) {
        <ng-container
          *ngTemplateOutlet="node; context: { $implicit: child, depth: depth + 1 }" />
      }
    </ng-template>

    <ng-container *ngTemplateOutlet="node; context: { $implicit: tree, depth: 0 }" />
  \`,
})
export class App {
  tree = fileTree;
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
  <head><title>Recursive templates with NgTemplateOutlet</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a new nested folder "utils" with two files "date.ts" and "string.ts" as a sibling of "components" inside the "app" folder, and verify it renders at the correct indentation depth automatically.',
    hint: 'Add { name: \'utils\', children: [{ name: \'date.ts\' }, { name: \'string.ts\' }] } as a new entry in the "app" node\'s children array — the recursive template handles the new depth automatically, no template changes needed.',
    solution: `{
  name: 'app',
  children: [
    { name: 'app.ts' },
    {
      name: 'components',
      children: [
        { name: 'header.ts' },
        { name: 'footer.ts' },
      ],
    },
    {
      name: 'utils',
      children: [
        { name: 'date.ts' },
        { name: 'string.ts' },
      ],
    },
  ],
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'rendering a recursive structure like a file tree requires a separate recursive Angular COMPONENT.',
      reality: 'a single <ng-template> referencing itself via *ngTemplateOutlet is enough — no separate component, selector, or file is needed for the recursive piece.',
    },
    {
      thought: 'recursive *ngTemplateOutlet needs an explicit base-case check to stop recursing.',
      reality: 'termination is implicit — a node with no children simply produces zero @for iterations at that branch, naturally stopping recursion without any explicit check.',
    },
    {
      thought: 'wrapping the recursive outlet call in a <div> vs <ng-container> is purely stylistic.',
      reality: 'a <div> wrapper adds a real DOM element at EVERY recursion level, which compounds across depth and can distort indentation-based or CSS-selector-based styling — <ng-container> avoids this entirely by emitting no DOM node.',
    },
  ];
}
