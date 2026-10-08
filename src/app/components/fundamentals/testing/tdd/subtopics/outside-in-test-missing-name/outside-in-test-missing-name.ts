import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-outside-in-test-missing-name',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './outside-in-test-missing-name.html',
  styleUrl: './outside-in-test-missing-name.scss'
})
export class OutsideInTestMissingNameSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "A red test that can never turn green",
      "points": [
        "The Outside-in tab called <code>app.register({ email: \"alice@example.com\", password: \"secret\" })</code> and asserted the email body matched <code>expect.stringContaining(\"Alice\")</code>.",
        "Checked with Jest's own <code>expect</code> package: <code>\"Welcome, alice@example.com\"</code> does not match <code>stringContaining(\"Alice\")</code>, because the comparison is case-sensitive. The only way through would be to invent a rule that capitalises the local part of the email, which nothing in the test asks for.",
        "In outside-in TDD the acceptance test is the specification. A test whose expected output cannot be derived from its input is a broken specification, and it will push the developer to guess.",
        "The fix is to put the name in the input: <code>register({ name: \"Alice\", email, password })</code>. The test now states exactly what the welcome email depends on."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before",
      "language": "typescript",
      "code": "await app.register({ email: 'alice@example.com', password: 'secret' });\n\nexpect(emailSpy).toHaveBeenCalledWith(\n  'alice@example.com',\n  'Welcome!',\n  expect.stringContaining('Alice'),   // where would 'Alice' come from?\n);"
    },
    {
      "label": "After",
      "language": "typescript",
      "code": "await app.register({ name: 'Alice', email: 'alice@example.com', password: 'secret' });\n\nexpect(emailSpy).toHaveBeenCalledWith(\n  'alice@example.com',\n  'Welcome!',\n  expect.stringContaining('Alice'),\n);"
    },
    {
      "label": "Checked with expect",
      "language": "typescript",
      "code": "import { expect } from 'expect';   // the matcher library Jest uses\n\nexpect('Welcome, alice@example.com').toEqual(expect.stringContaining('Alice')); // fails\nexpect('Hi Alice, welcome').toEqual(expect.stringContaining('Alice'));          // passes"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Product decides that when no name is given, the email should greet the user by the part of the address before the @. Write the extra test you would add, in the outside-in style, before touching the implementation.",
    "hint": "Make the rule visible in the test itself: an input without a name, and an expected greeting that follows from it.",
    "solution": "test('greets by email local part when no name is given', async () => { const emailSpy = jest.fn(); const app = new App({ emailClient: { send: emailSpy } }); await app.register({ email: 'bob@example.com', password: 'secret' }); expect(emailSpy).toHaveBeenCalledWith('bob@example.com', 'Welcome!', expect.stringContaining('bob')); });"
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A failing first test is always fine in TDD.",
      "reality": "It should fail because the code does not exist yet, not because the test asks for something its own setup never provides."
    },
    {
      "thought": "<code>expect.stringContaining</code> ignores case.",
      "reality": "It uses a plain substring check, so case matters. Use <code>expect.stringMatching(/alice/i)</code> for a case-insensitive check."
    }
  ];
}
