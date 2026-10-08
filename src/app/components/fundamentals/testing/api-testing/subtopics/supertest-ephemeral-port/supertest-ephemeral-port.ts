import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-supertest-ephemeral-port',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './supertest-ephemeral-port.html',
  styleUrl: './supertest-ephemeral-port.scss'
})
export class SupertestEphemeralPortSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the source does",
      "points": [
        "In <code>supertest/lib/test.js</code>, a plain app function is wrapped with <code>http.createServer(app)</code>. If that server has no address yet, Supertest calls <code>app.listen(0, '127.0.0.1')</code>; port 0 asks the OS for any free port.",
        "A test route that returned <code>req.socket.localPort</code> answered <code>{ port: 36113, addr: '127.0.0.1' }</code> — a real ephemeral port on loopback.",
        "The server started this way is shared by requests from the same request factory and closed when the last one settles, so tests do not leak listening sockets.",
        "So the benefit is not \"no port\" but \"no port you have to manage\": each test file gets its own free port and parallel runs do not collide. The page now says this."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "See the port",
      "language": "typescript",
      "code": "import request from 'supertest';\nimport express from 'express';\n\nconst app = express();\napp.get('/who', (req, res) =>\n  res.json({ port: req.socket.localPort, addr: req.socket.localAddress }));\n\nconst res = await request(app).get('/who');\nconsole.log(res.body); // { port: 36113, addr: '127.0.0.1' } - a fresh port each run"
    },
    {
      "label": "Export without listening",
      "language": "typescript",
      "code": "// src/app.ts\nexport const app = express();\n\n// src/server.ts (production entry only)\nimport { app } from './app';\napp.listen(Number(process.env.PORT ?? 3000));"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Two Jest workers each run a test file that calls <code>request(app)</code> on the same Express app. Why do they not fight over a port?",
    "hint": "What does port 0 mean?",
    "solution": "Each worker is its own process and Supertest calls listen(0) in it, so the OS hands each one a different free port. Nothing in the test chooses a fixed port number."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Supertest calls the route handlers directly without HTTP.",
      "reality": "It sends real HTTP to a server it started on 127.0.0.1 with an OS-chosen port."
    },
    {
      "thought": "Supertest tests can never conflict on ports.",
      "reality": "They can if the imported app module itself calls <code>listen(3000)</code>; keep listen out of the module you test."
    }
  ];
}
