import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-resets-and-sequences',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './resets-and-sequences.html',
  styleUrl: './resets-and-sequences.scss'
})
export class ResetsAndSequencesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured on PostgreSQL 16",
      "points": [
        "On a fresh table, the first insert returned id 1. After <code>TRUNCATE t</code>, the next insert returned id 2: the rows were gone, the sequence was not reset.",
        "After <code>TRUNCATE t RESTART IDENTITY</code>, the next insert returned id 1 again.",
        "Inside <code>BEGIN ... ROLLBACK</code>, an insert received id 2; after the rollback, the next insert received id 3. PostgreSQL never hands sequence values back, so the rollback strategy from the page leaves the same gap.",
        "This is the reason behind the page's own advice to seed fixed ids: assertions on generated ids depend on what ran before. Assert on the id the insert returned, not on a literal."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "sql",
      "code": "INSERT INTO t (name) VALUES ('a') RETURNING id;    -- 1\nTRUNCATE t;\nINSERT INTO t (name) VALUES ('a') RETURNING id;    -- 2\nTRUNCATE t RESTART IDENTITY;\nINSERT INTO t (name) VALUES ('a') RETURNING id;    -- 1\n\nBEGIN;\nINSERT INTO t (name) VALUES ('x') RETURNING id;    -- 2\nROLLBACK;\nINSERT INTO t (name) VALUES ('y') RETURNING id;    -- 3"
    },
    {
      "label": "Assert on returned ids",
      "language": "typescript",
      "code": "test('order belongs to the created user', async () => {\n  const user = await repo.createUser({ name: 'Alice' });\n  const order = await repo.createOrder({ userId: user.id });\n\n  expect(order.userId).toBe(user.id);   // not toBe(1)\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A suite resets data with <code>TRUNCATE users, orders CASCADE</code> in beforeEach. One test asserts <code>expect(user.id).toBe(1)</code>. Why does it pass when run alone and fail in the full suite?",
    "hint": "What does TRUNCATE leave behind?",
    "solution": "Run alone, it is the first insert into a fresh table, so the id is 1. In the full suite, earlier tests already used sequence values and TRUNCATE without RESTART IDENTITY does not reset them, so the id is higher. Add RESTART IDENTITY or, better, assert against the returned id."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Rolling back a transaction undoes everything it did.",
      "reality": "Sequence increments are not rolled back; that is how PostgreSQL avoids blocking concurrent inserts."
    },
    {
      "thought": "TRUNCATE returns a table to its freshly created state.",
      "reality": "It removes the rows. Identity sequences only restart with RESTART IDENTITY."
    }
  ];
}
