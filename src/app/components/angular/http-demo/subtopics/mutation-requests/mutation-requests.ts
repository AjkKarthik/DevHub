import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mutation-requests-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mutation-requests.html',
  styleUrl: './mutation-requests.scss',
})
export class MutationRequestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mutations are one-shot — subscribe(), not signal-ify',
      points: [
        'GET requests read data that a template can watch reactively — POST/PUT/PATCH/DELETE are triggered by a specific USER ACTION (clicking "Save", "Delete") and handled once, right there, rather than converted into an ongoing signal. <code>toSignal()</code>/<code>httpResource()</code> are the wrong tool here; a plain <code>.subscribe({ next, error })</code> call is the correct, idiomatic pattern.',
      ],
    },
    {
      heading: 'Always handle both next and error in the observer object',
      points: [
        '<code>http.post&lt;T&gt;(url, body).subscribe({ next: res =&gt; ..., error: err =&gt; ... })</code> — providing an observer OBJECT (rather than a single next-only callback) is what lets you handle both cases explicitly. An unhandled error in a subscribe call does not just vanish quietly — it propagates to Angular\'s global error handler and can surface as an unhandled-exception-style failure, especially disruptive in strict/zoneless setups.',
      ],
    },
    {
      heading: 'Request options — the third argument',
      points: [
        '<code>http.post(url, body, { headers: new HttpHeaders({ \'Content-Type\': \'application/json\' }), observe: \'response\' })</code> — the third argument carries headers, params, and response-shape options. <code>observe: \'response\'</code> returns the FULL <code>HttpResponse</code> (status code + headers + body) instead of just the parsed body, useful when you need to read a status code or a response header like <code>Location</code>.',
      ],
    },
    {
      heading: 'Optimistic updates — instant feedback, with a manual revert path',
      points: [
        'Update the local signal IMMEDIATELY (before the request even completes), then fire the mutation. This is what gives instant-feeling UI. On error, manually revert: <code>this.items.update(list =&gt; list.filter(i =&gt; i.id !== tempId))</code>. There is no special Angular API for this — it is just "update state now, undo it in the error callback if needed."',
        'Combine with <code>takeUntilDestroyed()</code> for a mutation that might still be in flight when the component is destroyed: <code>http.post(url, body).pipe(takeUntilDestroyed()).subscribe()</code>. Without it, the subscribe callback could fire AFTER destruction and call <code>signal.set()</code> on a component that no longer exists.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideHttpClient()],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Post { id: number; title: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <input #titleInput placeholder="New post title" />
    <button (click)="addPost(titleInput.value)">Add (optimistic)</button>

    <ul>
      @for (p of posts(); track p.id) {
        <li [class.pending]="p.id > 1000">{{ p.title }}</li>
      }
    </ul>

    <p>{{ status() }}</p>
  \`,
  styles: [\`.pending { opacity: .5; }\`],
})
export class App {
  private http = inject(HttpClient);

  posts = signal<Post[]>([]);
  status = signal('Ready.');

  addPost(title: string) {
    if (!title) return;

    // 1. Optimistic update — instant feedback, with a fake temp id
    const tempId = Date.now();
    this.posts.update(list => [...list, { id: tempId, title }]);
    this.status.set('Saving...');

    // 2. Fire the mutation — subscribe with BOTH next and error handled
    this.http.post<Post>('https://jsonplaceholder.typicode.com/posts', { title }).subscribe({
      next: (saved) => {
        // Replace the temp entry with the server's real response
        this.posts.update(list => list.map(p => p.id === tempId ? saved : p));
        this.status.set('Saved.');
      },
      error: () => {
        // Revert — remove the optimistic entry entirely
        this.posts.update(list => list.filter(p => p.id !== tempId));
        this.status.set('Save failed — reverted.');
      },
    });
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Mutation requests</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a removePost(id: number) method that optimistically removes the post from the local signal immediately, fires a DELETE request, and re-adds it back (reverts) if the DELETE fails.',
    hint: 'Save the removed post first (const removed = this.posts().find(p => p.id === id)) before filtering it out, so you have something to restore in the error callback: this.posts.update(list => [...list, removed!]).',
    solution: `removePost(id: number) {
  const removed = this.posts().find(p => p.id === id);
  this.posts.update(list => list.filter(p => p.id !== id));

  this.http.delete(\`https://jsonplaceholder.typicode.com/posts/\${id}\`).subscribe({
    next: () => this.status.set('Deleted.'),
    error: () => {
      if (removed) this.posts.update(list => [...list, removed]);
      this.status.set('Delete failed — reverted.');
    },
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'POST/PUT/DELETE should be converted to signals with toSignal(), the same way GET requests are.',
      reality: 'mutations are triggered by a specific user action and handled once — a plain .subscribe({ next, error }) call is the idiomatic pattern. toSignal() is for representing an ongoing, re-readable piece of state, which a one-shot mutation is not.',
    },
    {
      thought: 'an unhandled error in an HTTP subscribe call is silently swallowed and has no consequence.',
      reality: 'an unhandled error in a subscribe callback propagates to Angular\'s global error handler — it does not just vanish. Always provide an error handler in the observer object for any mutation that could realistically fail.',
    },
    {
      thought: 'optimistic UI updates require a special Angular API or library.',
      reality: 'it is just a manual two-step pattern: update the local signal immediately for instant feedback, then in the mutation\'s error callback, manually revert that same signal back to its previous state. No special API — just state management you write yourself.',
    },
  ];
}
