import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-linkedsignal-with-resource-for-editable-drafts-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './linkedsignal-with-resource-for-editable-drafts.html',
  styleUrl: './linkedsignal-with-resource-for-editable-drafts.scss',
})
export class LinkedsignalWithResourceForEditableDraftsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The edit-form problem: server data arrives asynchronously, but the form must be editable NOW',
      points: [
        'A classic edit-form needs: (1) fetch the record from the server, (2) let the user edit fields locally, (3) know if the user has unsaved changes, (4) if the server record changes underneath (e.g. a background refetch), decide whether to overwrite the draft or preserve it. This is exactly the "derived default, user-editable, conditional reset" shape <code>linkedSignal()</code> was built for — with a <code>resource()</code> as the source instead of a plain signal.',
        'The short form is not enough here because the SOURCE type (the resource\'s async result, which can be <code>undefined</code> while loading) differs from what you want the draft to look like once resolved — this is a long-form <code>{ source, computation }</code> case.',
      ],
    },
    {
      heading: 'Wiring a resource() as a linkedSignal source',
      points: [
        'Read <code>resource.value()</code> inside <code>source</code>: <code>source: () =&gt; this.userResource.value()</code>. While the resource is loading, <code>.value()</code> is <code>undefined</code> — the linkedSignal\'s computation must handle that case explicitly (return a sensible empty draft, not throw).',
        'Once the resource resolves, <code>source</code> re-evaluates (because a signal inside it — the resource\'s internal value signal — changed), producing the fetched record as the new source value, and <code>computation</code> builds the initial editable draft from it — a shallow copy so mutating the draft never mutates the resource\'s own cached value.',
      ],
    },
    {
      heading: 'Conditional carry-over: only reset the draft if the user has NOT started editing',
      points: [
        'The most valuable use of the <code>previous</code> argument here: if the resource refetches (e.g. via <code>.reload()</code> after a save) and the user has UNSAVED CHANGES in the draft, you usually do NOT want to silently overwrite their in-progress edits — <code>computation: (newRecord, prev) =&gt; (prev?.value?.isDirty ? prev.value : { ...newRecord, isDirty: false })</code> keeps the dirty draft intact while still resetting cleanly for a fresh, unedited load.',
        'This pattern turns "annoying data-loss bug where a background refresh wipes the user\'s in-progress edit" into an explicit, testable policy decision — the computation function IS the policy, readable in one place instead of scattered across event handlers.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/user-editor.ts',
      content: `import { Component, signal, resource, linkedSignal } from '@angular/core';

interface UserRecord { id: number; name: string; email: string; }
interface Draft extends UserRecord { isDirty: boolean; }

async function fetchUser(id: number): Promise<UserRecord> {
  // Simulated API call
  await new Promise(r => setTimeout(r, 500));
  return { id, name: 'Ada Lovelace', email: 'ada@example.com' };
}

@Component({
  selector: 'app-user-editor',
  standalone: true,
  template: \`
    @if (userResource.isLoading()) {
      <p>Loading…</p>
    } @else {
      <input [value]="draft().name" (input)="updateName($any($event.target).value)" />
      <input [value]="draft().email" (input)="updateEmail($any($event.target).value)" />
      <p>Dirty: {{ draft().isDirty }}</p>
      <button (click)="userResource.reload()">Reload from server</button>
    }
  \`,
})
export class UserEditorComponent {
  userId = signal(1);

  userResource = resource({
    params: () => this.userId(),
    loader: ({ params: id }) => fetchUser(id),
  });

  // Long-form linkedSignal: derives an editable draft from the resource,
  // but preserves a dirty (in-progress) draft across a background reload.
  draft = linkedSignal<UserRecord | undefined, Draft>({
    source: () => this.userResource.value(),
    computation: (record, prev) => {
      if (prev?.value?.isDirty) {
        return prev.value; // user is mid-edit — do NOT overwrite with fresh server data
      }
      return record
        ? { ...record, isDirty: false }
        : { id: 0, name: '', email: '', isDirty: false };
    },
  });

  updateName(value: string) {
    this.draft.update(d => ({ ...d, name: value, isDirty: true }));
  }

  updateEmail(value: string) {
    this.draft.update(d => ({ ...d, email: value, isDirty: true }));
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UserEditorComponent } from './user-editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserEditorComponent],
  template: \`
    <h3>linkedSignal + resource() editable draft</h3>
    <p>Edit a field, then click "Reload from server" — your dirty draft survives the
    background refetch instead of being silently overwritten.</p>
    <app-user-editor />
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
  <head><title>linkedSignal with resource() for editable drafts</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Discard changes" button that resets the draft back to the current resource value, clearing the dirty flag.',
    hint: 'Call draft.set({ ...userResource.value(), isDirty: false }) when the resource has a value, since draft is a WritableSignal and can be set directly, not just updated.',
    solution: `discardChanges() {
  const record = this.userResource.value();
  if (record) {
    this.draft.set({ ...record, isDirty: false });
  }
}

// Template:
// <button (click)="discardChanges()">Discard changes</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a linkedSignal derived from a resource() must always reset whenever the resource refetches, since that is the whole point of linkedSignal.',
      reality: 'the computation function can explicitly check the PREVIOUS draft state (e.g. an isDirty flag) and choose to preserve it instead of resetting — the reset is a POLICY you control, not an unconditional behavior.',
    },
    {
      thought: 'reading resource.value() inside computation instead of source would work just as well.',
      reality: 'only signals read inside source are tracked as reset triggers — reading resource.value() inside computation instead would mean the draft never resets when fresh data arrives, defeating the purpose entirely.',
    },
    {
      thought: 'the draft signal automatically stays in sync with mutations to the underlying resource value object.',
      reality: 'the computation builds a SHALLOW COPY of the resource value specifically so editing the draft never mutates the resource\'s own cached data — they are intentionally independent after the initial copy.',
    },
  ];
}
