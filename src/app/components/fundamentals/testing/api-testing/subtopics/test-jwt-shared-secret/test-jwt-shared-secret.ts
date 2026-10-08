import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-test-jwt-shared-secret',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './test-jwt-shared-secret.html',
  styleUrl: './test-jwt-shared-secret.scss'
})
export class TestJwtSharedSecretSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Reproduced with jsonwebtoken and Supertest",
      "points": [
        "An Express route verified tokens with <code>process.env.JWT_SECRET</code> (falling back to a dev secret). A token signed with <code>'test-secret'</code> and <code>role: 'admin'</code> got <strong>401</strong>, not 200.",
        "The 401 and 403 tests on the page would still look right; only the \"admin gets 200\" test exposes the mismatch.",
        "The fix is to make the test and the app agree on the secret. The tab now sets <code>process.env.JWT_SECRET</code> and explains when that must move to a setup file."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "jest.setup.ts",
      "language": "typescript",
      "code": "// jest.config.ts: setupFiles: ['<rootDir>/jest.setup.ts']\nprocess.env.JWT_SECRET = 'test-secret';"
    },
    {
      "label": "Test helper",
      "language": "typescript",
      "code": "import jwt from 'jsonwebtoken';\n\nexport function makeToken(payload: object) {\n  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });\n}\n\n// Expired-token test: same secret, past expiry\nexport const expired = () =>\n  jwt.sign({ id: 1 }, process.env.JWT_SECRET!, { expiresIn: -10 });"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your suite has three auth tests: no token gives 401, user token gives 403, admin token gives 200. The secrets do not match. Which tests fail, and why could a team miss this?",
    "hint": "Which of them needs verification to succeed?",
    "solution": "Only the admin test fails, and the user test also fails because it gets 401 instead of 403. The no-token test passes. If a team only wrote the 401 test, nothing would show the mismatch."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Any validly signed JWT is accepted by the app.",
      "reality": "Verification checks the signature against the app's own secret; a different secret is the same as a forged token."
    },
    {
      "thought": "Assigning <code>process.env.JWT_SECRET</code> at the top of a test file always works.",
      "reality": "ES imports run first; if the app reads the secret at import time, use a setup file."
    }
  ];
}
