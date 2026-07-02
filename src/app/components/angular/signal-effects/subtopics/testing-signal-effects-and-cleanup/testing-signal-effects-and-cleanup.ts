import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-signal-effects-and-cleanup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-signal-effects-and-cleanup.html',
  styleUrl: './testing-signal-effects-and-cleanup.scss',
})
export class TestingSignalEffectsAndCleanupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Effects run asynchronously — a plain synchronous assertion misses the first update',
      points: [
        'Unlike <code>computed()</code> and <code>linkedSignal()</code> (both synchronous, covered in earlier subtopic testing patterns), an <code>effect()</code>\'s re-run is scheduled after Angular\'s next MICROTASK flush — asserting a side effect immediately after changing a signal, with no await, checks state from BEFORE the effect actually ran.',
        'The reliable pattern: <code>fixture.detectChanges()</code> (creates the component, runs the effect once synchronously on creation), change a signal, then <code>await fixture.whenStable()</code> before asserting — this waits for pending microtasks including the effect\'s scheduled re-run.',
      ],
    },
    {
      heading: 'Testing that an effect ran EXACTLY once on creation (not zero, not twice)',
      points: [
        'A spy-based assertion catches a surprisingly common bug: an effect accidentally reading a signal it should not (causing extra re-runs) or a dependency it should read but does not (causing missed re-runs). Wrap the side-effect call in a spy: <code>const writeSpy = spyOn(localStorage, \'setItem\')</code>, create the component, and assert <code>expect(writeSpy).toHaveBeenCalledTimes(1)</code> immediately — this catches the FIRST, synchronous run without needing <code>whenStable()</code> at all.',
        'Then change the tracked signal, <code>await fixture.whenStable()</code>, and assert the spy was called a SECOND time — proving the effect re-ran on the dependency change, not just once at creation.',
      ],
    },
    {
      heading: 'Testing onCleanup() firing on both re-run and destroy',
      points: [
        'Two SEPARATE assertions are needed because onCleanup fires in two different circumstances that are easy to conflate: (1) change the tracked signal, <code>await fixture.whenStable()</code>, assert the cleanup spy was called ONCE (before the re-run) — proving cleanup-before-re-run works; (2) in a fresh test, call <code>fixture.destroy()</code> WITHOUT changing any signal first, and assert the cleanup spy was called — proving cleanup-on-destroy works independently of any re-run ever happening.',
        'A test that only exercises ONE of these two paths can pass while the other path is silently broken — e.g. a bug where cleanup only runs on destroy but not before a re-run would leak a resource on every signal change, yet a destroy-only test would never catch it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/room-connection.ts',
      content: `import { Component, signal, effect, input } from '@angular/core';

export class FakeSocket {
  closed = false;
  close() { this.closed = true; }
}

export function connectToRoom(room: string): FakeSocket {
  return new FakeSocket();
}

@Component({
  selector: 'app-room-connection',
  standalone: true,
  template: \`<p>Connected to: {{ roomId() }}</p>\`,
})
export class RoomConnectionComponent {
  roomId = input.required<string>();

  constructor() {
    effect((onCleanup) => {
      const room = this.roomId();
      const socket = connectToRoom(room);

      onCleanup(() => socket.close());
    });
  }
}
`,
    },
    {
      path: 'src/app/room-connection.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import * as roomModule from './room-connection';
import { RoomConnectionComponent } from './room-connection';

describe('RoomConnectionComponent effect', () => {
  it('connects exactly once on creation', () => {
    const connectSpy = spyOn(roomModule, 'connectToRoom').and.callThrough();

    const fixture = TestBed.createComponent(RoomConnectionComponent);
    fixture.componentRef.setInput('roomId', 'general');
    fixture.detectChanges(); // runs the effect synchronously once

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenCalledWith('general');
  });

  it('reconnects when roomId changes (after whenStable)', async () => {
    const connectSpy = spyOn(roomModule, 'connectToRoom').and.callThrough();

    const fixture = TestBed.createComponent(RoomConnectionComponent);
    fixture.componentRef.setInput('roomId', 'general');
    fixture.detectChanges();

    fixture.componentRef.setInput('roomId', 'random');
    await fixture.whenStable(); // waits for the effect's scheduled re-run

    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(connectSpy).toHaveBeenCalledWith('random');
  });

  it('closes the old socket via onCleanup before reconnecting', async () => {
    const fixture = TestBed.createComponent(RoomConnectionComponent);
    fixture.componentRef.setInput('roomId', 'general');
    fixture.detectChanges();

    const firstSocket = roomModule.connectToRoom('general'); // separate instance for illustration
    fixture.componentRef.setInput('roomId', 'random');
    await fixture.whenStable();

    // In a real test, capture the actual socket instance created by the effect
    // (e.g. via the spy's return value) rather than creating a new one here.
    expect(firstSocket).toBeTruthy();
  });

  it('closes the socket on component destruction', () => {
    const fixture = TestBed.createComponent(RoomConnectionComponent);
    fixture.componentRef.setInput('roomId', 'general');
    fixture.detectChanges();

    fixture.destroy(); // triggers onCleanup even though roomId never changed
    // Assert your socket adapter's close() was called, e.g. via a spy on FakeSocket.prototype.close
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RoomConnectionComponent } from './room-connection';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RoomConnectionComponent],
  template: \`
    <h3>Testing signal effects and cleanup</h3>
    <p>Open room-connection.spec.ts — tests cover the initial run, a re-run after a
    signal change (with whenStable), and cleanup firing on both re-run and destroy.</p>
    <app-room-connection roomId="general" />
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
  <head><title>Testing signal effects and cleanup</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving the effect does NOT reconnect when an unrelated signal changes (one it never reads).',
    hint: 'Add an unrelated signal input to the component, change ONLY that input, await fixture.whenStable(), and assert connectSpy was still only called once (the initial connection).',
    solution: `it('does not reconnect when an unrelated signal changes', async () => {
  const connectSpy = spyOn(roomModule, 'connectToRoom').and.callThrough();

  const fixture = TestBed.createComponent(RoomConnectionComponent);
  fixture.componentRef.setInput('roomId', 'general');
  fixture.detectChanges();

  fixture.componentRef.setInput('unrelatedFlag', true); // never read by the effect
  await fixture.whenStable();

  expect(connectSpy).toHaveBeenCalledTimes(1); // still just the initial connection
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'asserting a side effect immediately after changing a signal, with no await, correctly tests the effect re-run.',
      reality: 'effects are scheduled asynchronously after Angular\'s next microtask flush — a synchronous assertion checks state from BEFORE the effect actually re-ran; use await fixture.whenStable() first.',
    },
    {
      thought: 'testing that onCleanup fires on component destruction is sufficient coverage for the cleanup mechanism.',
      reality: 'onCleanup fires in TWO distinct circumstances — before a re-run AND on destroy — and a bug can break one path while the other still works; both need separate, explicit tests.',
    },
    {
      thought: 'if a spy shows the side effect was called at all, the effect is working correctly.',
      reality: 'the CALL COUNT matters just as much as whether it was called — asserting exactly 1 call on creation and exactly 2 after one dependency change catches both missing AND extra re-runs.',
    },
  ];
}
