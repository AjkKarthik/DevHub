import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './server-close-and-idle-keep-alive-connections-since-node-19.html',
  styleUrl: './server-close-and-idle-keep-alive-connections-since-node-19.scss'
})
export class ServerCloseAndIdleKeepAliveConnectionsSinceNode19Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'server.close() historically could hang on idle keep-alive connections — Node 19 changed the default',
      points: [
        'The main page\'s own graceful-shutdown code calls server.close(callback) and relies on the callback firing once in-flight requests drain. That callback is tied to Node\'s "close" event, which requires ALL connections to end — and for older Node versions, an idle HTTP keep-alive connection (a socket a client is holding open with no request currently in flight) counted as "not yet ended," even though it has no active work at all.',
        'Node\'s own documentation confirms this changed in a specific version: server.close()\'s history notes state "v19.0.0: The method closes idle connections before returning." Before that version, a client that opened a keep-alive connection and simply never closed it (a common, legitimate HTTP/1.1 pattern) could keep server.close()\'s callback from ever firing — the main page\'s own 10-second force-exit timeout exists specifically as a safety net for exactly this kind of hang.',
        'Node 18.2.0 separately introduced two explicit methods for this: server.closeAllConnections() forcibly closes every connection immediately, including ones actively mid-request (skipping graceful completion) — and server.closeIdleConnections() closes only the connections that are NOT currently processing a request, which is the precise, non-disruptive fix for the idle-keep-alive hang. Node\'s own docs for closeIdleConnections() state plainly: "Starting with Node.js 19.0.0, there\'s no need for calling this method in conjunction with server.close to reap keep-alive connections" — confirming v19\'s default behavior change made the idle-specific call unnecessary going forward, while closeAllConnections() remains useful on any version for a hard, immediate cutoff.',
      ]
    },
    {
      heading: 'What this means for the main page\'s own shutdown code today',
      points: [
        'The main page\'s Dockerfile pins node:20.11.1-alpine — Node 20 already includes the v19+ behavior, so server.close() alone already closes idle keep-alive connections before its callback fires on that exact setup. The force-exit timeout is still worth keeping (it protects against slow in-flight requests genuinely taking too long, a different problem entirely), but the specific idle-keep-alive-hang scenario this subtopic describes is largely a pre-19 Node concern for a codebase already pinned to Node 20.',
        'The practical takeaway generalizes beyond this one API: a graceful-shutdown pattern copied from an older blog post, Stack Overflow answer, or a codebase still running an older Node LTS may include closeIdleConnections() calls (or work around their absence) that are simply redundant on Node 19+ — worth checking the actual Node version pinned in a Dockerfile before assuming an older shutdown pattern\'s workarounds are still necessary.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pre-Node-19 pattern: closeIdleConnections() needed alongside close()',
      language: 'typescript',
      code: `import { createServer } from 'node:http';

const server = createServer(app);

async function shutdown(signal) {
  isReady = false;

  server.close(async () => {
    await db.end();
    process.exit(0);
  });

  // Pre-v19: an idle keep-alive client can keep server.close()'s
  // callback from EVER firing on its own. This explicit call closes
  // just the idle sockets, letting in-flight requests finish normally.
  server.closeIdleConnections();

  setTimeout(() => {
    // Belt-and-braces: forcibly cut everything still open, including
    // requests that are genuinely still in progress and just slow.
    server.closeAllConnections();
    process.exit(1);
  }, 10_000).unref();
}`,
    },
    {
      label: 'Node 19+: server.close() already reaps idle connections',
      language: 'typescript',
      code: `import { createServer } from 'node:http';

const server = createServer(app);

async function shutdown(signal) {
  isReady = false;

  // On Node 19+ (including the main page's own pinned node:20.11.1),
  // server.close() itself now closes idle keep-alive connections
  // before its callback fires — no separate closeIdleConnections()
  // call is required just to unblock the callback anymore.
  server.close(async () => {
    await db.end();
    process.exit(0);
  });

  // Still worth keeping: protects against requests that are
  // genuinely still in flight and simply taking too long, a
  // different scenario than an idle connection with no work at all.
  setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 10_000).unref();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team maintains a graceful-shutdown handler copied years ago from a blog post targeting Node 16. It calls both server.close(callback) and server.closeIdleConnections() immediately afterward, "just in case." A new engineer proposes removing the closeIdleConnections() call as dead code, since the Dockerfile now pins node:20-alpine. Evaluate whether removing it is safe, and explain what (if anything) is still worth double-checking before doing so.',
    hint: 'What did this subtopic\'s theory say actually changed in Node 19.0.0 about server.close() itself? Does removing closeIdleConnections() change behavior on a codebase already running Node 20?',
    solution: 'Removing the explicit server.closeIdleConnections() call is safe on Node 20 specifically because Node\'s own documentation confirms server.close() itself was changed in v19.0.0 to close idle connections before its callback fires — meaning the closeIdleConnections() call is redundant on any Node version from 19 onward, doing nothing that server.close() doesn\'t already do on its own. Since the Dockerfile pins node:20-alpine, the idle-connection-reaping behavior this subtopic describes is already active without the extra call. What is still worth double-checking before removing it: (1) that node:20-alpine genuinely resolves to a Node.js version ≥19 at build time (any Node 20.x release satisfies this, since 20 is well past 19), and (2) that no OTHER part of the codebase or its CI pipeline runs the same shutdown code path against an older Node version (a local dev environment on an outdated Node install, or a different service still on Node 16/18 sharing the same shutdown utility module) — since removing the call would reintroduce the idle-connection hang risk specifically for any environment still running pre-19 Node. If the shutdown code is shared across services with different pinned Node versions, keeping the (now redundant-on-20+, but harmless) call is the safer choice.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'server.close(callback) always waits only for genuinely in-flight requests to finish before firing its callback — an idle connection with no pending request has no bearing on when the callback fires, regardless of Node version.',
      reality: 'This subtopic\'s theory and first code example both show this was NOT true before Node 19 — an idle keep-alive connection (no active request, just an open socket) could keep server.close()\'s callback from firing indefinitely, which is exactly why closeIdleConnections() was introduced as a targeted fix.'
    },
    {
      thought: 'server.closeIdleConnections() and server.closeAllConnections() do the same thing, just with slightly different names — either one is a safe drop-in replacement for the other in a graceful-shutdown handler.',
      reality: 'This subtopic\'s theory explains the real, important difference — closeIdleConnections() only closes connections with no request currently in flight (safe, non-disruptive), while closeAllConnections() forcibly closes EVERY connection including ones actively mid-request, which is exactly the disruptive, last-resort behavior a force-exit timeout is meant to trigger, not something to call casually during normal shutdown.'
    },
    {
      thought: 'Since the main page\'s own Dockerfile pins a specific Node version (node:20.11.1-alpine), whatever graceful-shutdown code pattern works correctly on that pinned version is guaranteed to behave identically on any other Node version the same code might run on (local dev, a different service, an older environment).',
      reality: 'This subtopic\'s exercise shows the opposite — server.close()\'s own idle-connection-closing behavior is version-dependent (changed specifically in Node 19.0.0), so shutdown code that works correctly on a pinned Node 20 image can behave differently (or hang) if the exact same code runs against an older Node version elsewhere.'
    }
  ];
}
