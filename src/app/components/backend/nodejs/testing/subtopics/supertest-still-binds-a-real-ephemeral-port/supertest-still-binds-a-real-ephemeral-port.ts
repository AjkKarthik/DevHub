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
  templateUrl: './supertest-still-binds-a-real-ephemeral-port.html',
  styleUrl: './supertest-still-binds-a-real-ephemeral-port.scss'
})
export class SupertestStillBindsARealEphemeralPortSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Supertest does not bypass the network stack — it binds a real, OS-assigned ephemeral port for you',
      points: [
        'It is tempting to read the main page\'s own integration-test example — request(app).post("/users")... with no visible app.listen(port) call anywhere — and conclude Supertest talks to the Express app directly in-process, with no real networking involved at all. That is not what actually happens.',
        'Supertest\'s own documentation states: "You may pass an http.Server, or a Function to request() - if the server is not already listening for connections then it is bound to an ephemeral port for you." When request(app) is given a plain Express app (a request handler function, not an already-listening http.Server), Supertest wraps it internally via http.createServer(app), and on the first request, binds that server to an OS-assigned ephemeral port using .listen(0) — the standard Node.js convention for "give me any free port."',
        'So a real TCP socket genuinely gets bound for every Supertest-driven test run against an unlistened app — it is not virtual, mocked, or bypassed. What Supertest actually removes is the manual work: you never choose a port number yourself, never coordinate that number across parallel test files or CI workers, and never explicitly call .listen()/.close() around every test. Port 0 (an OS-level convention, not a Supertest invention) means the operating system picks a genuinely free port every time, which is what eliminates port-conflict flakiness across concurrently running test suites.',
      ]
    },
    {
      heading: 'What this means for reasoning about Supertest-based tests',
      points: [
        'Because a real port is bound, code paths that only run when the server actually starts listening (an app.listen(port, () => console.log(...)) callback, or middleware/logic conditioned on a real bound address) genuinely CAN execute during a Supertest-driven test — this is different from, say, a fully in-process mock of the HTTP layer, which would never touch any of that server-startup code at all.',
        'This also explains why testing HTTP-server-level concerns (connection keep-alive behavior, actual TCP-level timeouts) is possible with Supertest in principle, even though the main page\'s own examples focus on request/response body and status code assertions — the underlying transport is real, even if the port number is anonymous and ephemeral.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'No app.listen() call in the test — but a port IS bound internally',
      language: 'typescript',
      code: `import request from 'supertest';
import { app } from '../app'; // a plain Express app, never listening

test('GET /health returns 200', async () => {
  // No app.listen(3000) anywhere in this file. Supertest still
  // binds a real ephemeral port under the hood on this first call —
  // it just does it for you, using port 0.
  const res = await request(app).get('/health').expect(200);
  expect(res.body.status).toBe('ok');
});

test('multiple test files running in parallel never collide on a port', async () => {
  // Every test file gets its OWN ephemeral port from the OS (port 0
  // resolves to a different free port each time), which is why
  // running many Supertest suites concurrently in CI never produces
  // EADDRINUSE — not because no port is used, but because the OS
  // guarantees each bound port is actually free at bind time.
  const res = await request(app).get('/health').expect(200);
  expect(res.status).toBe(200);
});`,
    },
    {
      label: 'What Supertest is roughly doing internally (simplified)',
      language: 'typescript',
      code: `import http from 'node:http';

// Simplified illustration of Supertest's actual mechanism —
// NOT the real supertest source, just the core idea it documents:
function makeTestRequest(app) {
  // app is a plain Express request-handler function here,
  // not an already-listening http.Server.
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {                 // 0 = "OS, pick a free port"
      const { port } = server.address();       // the actual assigned port
      http.get(\`http://127.0.0.1:\${port}/health\`, (res) => {
        server.close();                        // torn down after the request
        resolve(res.statusCode);
      }).on('error', reject);
    });
  });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "We should stop using Supertest and switch to calling our Express route handlers directly as plain functions in tests, since Supertest already avoids the network entirely — direct function calls would just be a faster version of the exact same thing." Using what this subtopic covers, evaluate whether that reasoning is accurate.',
    hint: 'Does Supertest genuinely avoid the network layer entirely, the way the teammate assumes — or does it still involve a real (if ephemeral, auto-assigned) TCP port and a real HTTP request/response cycle?',
    solution: 'The teammate\'s reasoning rests on an inaccurate premise — Supertest does not avoid the network entirely. Per its own documentation and internal mechanism, when given a plain Express app, Supertest wraps it via http.createServer(app) and binds it to a real, OS-assigned ephemeral port with .listen(0), then issues genuine HTTP requests against that real port. So switching to calling route handlers directly as plain functions would NOT be "a faster version of the exact same thing" — it would be testing a fundamentally different thing. Supertest\'s real HTTP request/response cycle exercises everything Express\'s actual routing, middleware chain, body-parsing, and header/status-code serialization do — none of which happens if you call a route handler function directly, bypassing Express\'s router matching and middleware pipeline entirely. Calling handlers directly might be faster, but it would silently stop testing whether the actual HTTP-facing behavior (middleware ordering, route matching, status codes as they\'d really be sent over the wire) works correctly — which is precisely the class of integration bug the main page\'s own testing pyramid theory says integration tests exist to catch. The genuine, verified benefit of Supertest over manually managing your own real server for tests isn\'t "no networking" — it\'s not having to pick, coordinate, or clean up a port number yourself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a Supertest-driven test never calls app.listen(someHardcodedPort) itself, Supertest must be bypassing the network stack entirely and talking to the Express app in-process, with no real HTTP request actually happening.',
      reality: 'This subtopic\'s theory and second code example both show the opposite — Supertest wraps the app via http.createServer(app) and binds a genuinely real, OS-assigned ephemeral TCP port with .listen(0), then issues an actual HTTP request against that port; nothing about the transport is skipped or faked.'
    },
    {
      thought: 'Because Supertest handles the port automatically, running many Supertest-based test files in parallel should risk port conflicts (EADDRINUSE) the same way manually hardcoding a fixed port number across multiple test files would.',
      reality: 'This subtopic\'s first code example explains why this does not happen — Supertest uses port 0, the OS-level convention meaning "assign any currently free port," so every test file\'s server genuinely gets its own free port chosen by the operating system, eliminating the exact port-conflict flakiness that hardcoding a shared port number would cause.'
    },
    {
      thought: 'Testing Express route handlers by calling them directly as plain functions (skipping Supertest and any real HTTP layer) is functionally equivalent to testing them via Supertest, just faster, since Supertest was assumed to skip the network anyway.',
      reality: 'This subtopic\'s exercise shows the opposite — since Supertest genuinely exercises a real HTTP request/response cycle through Express\'s actual router and middleware pipeline, calling a handler function directly tests something meaningfully different (and narrower) than what a Supertest-driven integration test verifies, regardless of any speed difference.'
    }
  ];
}
