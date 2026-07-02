import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-optimistic-updates-rollback-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './optimistic-updates-rollback.html',
  styleUrl: './optimistic-updates-rollback.scss',
})
export class OptimisticUpdatesRollbackSubtopic {

  tsqDeps = { '@tanstack/angular-query-experimental': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The three-hook pattern — onMutate, onError, onSettled',
      points: [
        '<code>onMutate(variables)</code> runs SYNCHRONOUSLY before the mutation function fires — this is where you snapshot the CURRENT cache value (<code>queryClient.getQueryData(key)</code>), then write the OPTIMISTIC new value into the cache (<code>queryClient.setQueryData(key, updater)</code>) so the UI updates instantly, before the network request even resolves.',
        '<code>onMutate</code> must RETURN the snapshot — whatever object it returns becomes the <code>context</code> argument passed to both <code>onError</code> and <code>onSettled</code>. This is the mechanism for getting the "before" state to the rollback handler.',
        '<code>onError(err, variables, context)</code> runs if the mutation actually fails — use <code>context</code> (the snapshot returned from <code>onMutate</code>) to restore the cache to its PRE-optimistic state: <code>queryClient.setQueryData(key, context.previousData)</code>.',
        '<code>onSettled(data, error, variables, context)</code> runs after EITHER success or failure — the standard place to call <code>queryClient.invalidateQueries()</code>, guaranteeing the cache is eventually reconciled with the real server state regardless of whether the optimistic guess was correct.',
      ],
    },
    {
      heading: 'Why this order matters',
      points: [
        'Without <code>onMutate</code> cancelling any in-flight refetch first (<code>await queryClient.cancelQueries({ queryKey: key })</code>), a background refetch that resolves AFTER your optimistic write can silently overwrite it with stale pre-mutation data — always cancel outgoing queries for that key before writing the optimistic value.',
        'The optimistic UI update happens IMMEDIATELY (no network wait) — the user sees the change instantly. If the request later fails, <code>onError</code>\'s rollback is what makes this safe: the UI briefly shows the intended change, then reverts if the server rejects it, rather than lying to the user indefinitely.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';

interface Todo { id: number; text: string; done: boolean; }

let todos: Todo[] = [
  { id: 1, text: 'Buy milk', done: false },
  { id: 2, text: 'Walk the dog', done: false },
];

function fetchTodos(): Promise<Todo[]> {
  return new Promise(resolve => setTimeout(() => resolve([...todos]), 300));
}

function toggleTodoOnServer(id: number): Promise<Todo> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate a server that randomly rejects, to demonstrate rollback
      if (Math.random() < 0.4) {
        reject(new Error('Server rejected the update'));
        return;
      }
      todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
      resolve(todos.find(t => t.id === id)!);
    }, 500);
  });
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Optimistic toggle — ~40% chance of server rejection + rollback</h3>
    @if (todosQuery.data(); as list) {
      @for (todo of list; track todo.id) {
        <div>
          <label>
            <input type="checkbox" [checked]="todo.done" (change)="toggle(todo.id)" />
            {{ todo.text }}
          </label>
        </div>
      }
    }
    @if (toggleMutation.isError()) {
      <p style="color: red;">Update failed — rolled back to previous state.</p>
    }
  \`,
})
export class App {
  private queryClient = injectQueryClient();

  todosQuery = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  }));

  toggleMutation = injectMutation(() => ({
    mutationFn: toggleTodoOnServer,
    onMutate: async (id: number) => {
      await this.queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousData = this.queryClient.getQueryData<Todo[]>(['todos']);

      this.queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map(t => t.id === id ? { ...t, done: !t.done } : t),
      );

      return { previousData }; // becomes 'context' in onError/onSettled
    },
    onError: (err, id, context) => {
      // Roll back to the pre-optimistic snapshot
      this.queryClient.setQueryData(['todos'], context?.previousData);
    },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  }));

  toggle(id: number) {
    this.toggleMutation.mutate(id);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideTanStackQuery(new QueryClient())],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Optimistic updates and rollback</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the server rejection probability from 40% to 80% (Math.random() < 0.8) to see the rollback happen more often, and confirm the checkbox visibly snaps back after a failed toggle.',
    hint: 'Change Math.random() < 0.4 to Math.random() < 0.8 inside toggleTodoOnServer.',
    solution: `if (Math.random() < 0.8) {
  reject(new Error('Server rejected the update'));
  return;
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'onError automatically knows what the "previous" data was without any extra work.',
      reality: 'onError only receives whatever context object onMutate explicitly returned — the snapshot must be captured and returned by onMutate yourself, there is no automatic "undo" mechanism.',
    },
    {
      thought: 'invalidateQueries() is only needed when the mutation fails, to fix the incorrect optimistic guess.',
      reality: 'onSettled (which typically calls invalidateQueries) runs on BOTH success and failure — even a successful optimistic guess should be reconciled with the real server response, since your guess might not exactly match what the server actually computed.',
    },
    {
      thought: 'skipping cancelQueries() before writing the optimistic value is a harmless simplification.',
      reality: 'without cancelling in-flight queries for that key first, a background refetch that resolves AFTER your optimistic write can silently overwrite it with stale pre-mutation data — a real race condition, not just a style choice.',
    },
  ];
}
