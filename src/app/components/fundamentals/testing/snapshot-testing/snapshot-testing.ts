import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-snapshot-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './snapshot-testing.html',
  styleUrl: './snapshot-testing.scss',
})
export class SnapshotTesting {
  quickRef: QuickRefItem[] = [
    { name: 'toMatchSnapshot()',       type: 'method',  desc: 'First run: creates a .snap file. Subsequent runs: diffs against it.' },
    { name: 'toMatchInlineSnapshot()', type: 'method',  desc: 'Stores the snapshot as a string literal inside the test file.' },
    { name: '--updateSnapshot (-u)',    type: 'keyword', desc: 'Jest CLI flag to regenerate all outdated snapshots.' },
    { name: '__snapshots__/',          type: 'keyword', desc: 'Directory where .snap files are stored alongside the test file.' },
    { name: 'toMatchSnapshot(opts)',   type: 'method',  desc: 'Options: { propertyMatchers } to replace dynamic values with matchers.' },
    { name: 'jest-snapshot',           type: 'keyword', desc: 'The underlying package powering Jest snapshots — also used by Vitest.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'How Snapshots Work', points: [
      'First run: toMatchSnapshot() serialises the value and writes it to a .snap file.',
      'Subsequent runs: serialise again and diff against the stored snapshot.',
      'If they match — test passes. If they differ — test fails with a diff output.',
      'Running with --updateSnapshot regenerates all outdated snapshots.',
    ]},
    { heading: 'When Snapshots Are Useful', points: [
      'Serialisable outputs: API response shapes, complex objects, React component trees.',
      'Catching unintended regressions in large rendered HTML.',
      'Documenting the expected output of a pure serialisation function.',
      'NOT useful for rapidly-changing UI components or dynamic values (dates, random IDs).',
    ]},
    { heading: 'Inline Snapshots', points: [
      'toMatchInlineSnapshot() stores the snapshot string directly in the test — no .snap file.',
      'Jest auto-fills the string on first run and updates it when you pass -u.',
      'Better for small, focused snapshots — reviewer can see expected output in the same file.',
      'Prefer inline snapshots for small outputs; file snapshots for large HTML trees.',
    ]},
    { heading: 'Snapshot Pitfalls', points: [
      'Auto-updating with -u blindly: you regenerate snapshots without reviewing the diff.',
      'Snapshots of dynamic values (Date.now(), uuid()) always diff — use property matchers.',
      'Large HTML snapshots become noise — minor class renames cause irrelevant failures.',
      'Snapshot tests are fragile specifications — they break on any change, intended or not.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic Snapshot', language: 'typescript', code:
`import { render } from '@testing-library/react';
import { Badge } from './Badge';

test('Badge renders correctly', () => {
  const { container } = render(<Badge label="New" color="green" />);
  expect(container).toMatchSnapshot();
});

// First run creates __snapshots__/Badge.test.tsx.snap:
// exports[\`Badge renders correctly 1\`] = \`
// <div>
//   <span class="badge badge-green">New</span>
// </div>
// \`;` },
    { label: 'Inline Snapshot', language: 'typescript', code:
`import { formatUser } from './format';

test('formats user for display', () => {
  const user = { id: 1, firstName: 'Alice', lastName: 'Smith', role: 'admin' };
  expect(formatUser(user)).toMatchInlineSnapshot(\`
    {
      "displayName": "Alice Smith",
      "initials": "AS",
      "isAdmin": true,
    }
  \`);
});
// Jest writes/updates the string inside toMatchInlineSnapshot() on first run.` },
    { label: 'Property Matchers', language: 'typescript', code:
`// Dynamic values (IDs, timestamps) break snapshots every run.
// Use property matchers to replace them:

test('createUser returns correct shape', async () => {
  const user = await createUser({ name: 'Bob' });

  expect(user).toMatchSnapshot({
    id:        expect.any(String),     // dynamic UUID — match type only
    createdAt: expect.any(String),     // dynamic timestamp
    // 'name' is not in matchers — exact value 'Bob' is snapshotted
  });
});

// Generated snapshot:
// {
//   "id": Any<String>,
//   "createdAt": Any<String>,
//   "name": "Bob",
// }` },
    { label: 'Object Snapshot', language: 'typescript', code:
`// Snapshot serializable objects — not just JSX
import { parseConfig } from './config-parser';

test('parses config file correctly', () => {
  const config = parseConfig(\`
    server:
      port: 3000
      host: localhost
    db:
      pool: 5
  \`);

  expect(config).toMatchInlineSnapshot(\`
    {
      "db": {
        "pool": 5,
      },
      "server": {
        "host": "localhost",
        "port": 3000,
      },
    }
  \`);
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Auto-updating snapshots without reviewing', wrong: 'jest --updateSnapshot // run blindly in CI or after any failure', right: 'review the diff first: jest --verbose; only update if the change is intentional', explanation: 'Running -u without review means you accept whatever the new output is — including bugs. The snapshot stops being a guard and becomes a rubber stamp.' },
    { title: 'Snapshotting dynamic values', wrong: 'expect({ id: uuid(), at: Date.now() }).toMatchSnapshot()', right: 'expect({ id: uuid(), at: Date.now() }).toMatchSnapshot({ id: expect.any(String), at: expect.any(Number) })', explanation: 'Dynamic values diff on every run, making the snapshot meaningless and causing false failures.' },
    { title: 'Snapshotting too much', wrong: 'expect(document.body).toMatchSnapshot() // entire page', right: 'snapshot a small, stable, meaningful component or value', explanation: 'Large snapshots contain hundreds of irrelevant lines. Any minor change causes a wall of red diff — impossible to review meaningfully.' },
    { title: 'Using snapshots for behaviour testing', wrong: 'snapshot the button DOM to verify it calls onClick', right: 'userEvent.click(button); expect(mockFn).toHaveBeenCalled()', explanation: 'Snapshots test structure, not behaviour. Use interaction tests for verifying what happens when the user acts.' },
    { title: 'Not committing snapshot files', wrong: '.gitignore: __snapshots__/', right: 'commit __snapshots__/ alongside the test files', explanation: 'Snapshot files are part of the test. They must be committed so CI can compare against them. Gitignoring them means every CI run "passes" by creating new snapshots.' },
  ];

  challenge: Challenge = {
    title: 'Write snapshot tests with property matchers',
    language: 'typescript',
    description: 'Write snapshot tests for a formatProduct(p) function that returns { slug, displayPrice, label }. Use an inline snapshot for the stable shape and a property matcher for any dynamic field.',
    hints: [
      'toMatchInlineSnapshot() for the whole object if values are stable.',
      'If the function returns a timestamp, use expect.any(String) as a property matcher.',
    ],
    starterCode:
`function formatProduct(p: { name: string; price: number }) {
  return {
    slug: p.name.toLowerCase().replace(/\s+/g, '-'),
    displayPrice: \`$\${p.price.toFixed(2)}\`,
    label: \`\${p.name} — $\${p.price.toFixed(2)}\`,
  };
}

// Write your snapshot test here`,
    solution:
`function formatProduct(p: { name: string; price: number }) {
  return {
    slug: p.name.toLowerCase().replace(/\s+/g, '-'),
    displayPrice: \`$\${p.price.toFixed(2)}\`,
    label: \`\${p.name} — $\${p.price.toFixed(2)}\`,
  };
}

test('formatProduct returns correct shape', () => {
  const result = formatProduct({ name: 'Widget Pro', price: 29.99 });
  expect(result).toMatchInlineSnapshot(\`
    {
      "displayPrice": "$29.99",
      "label": "Widget Pro — $29.99",
      "slug": "widget-pro",
    }
  \`);
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What happens when you run toMatchSnapshot() for the first time?', options: ['The test fails — no snapshot exists', 'The test passes and creates a .snap file with the current output', 'Jest prompts you to enter the expected value', 'The test is skipped'], answer: 1, explanation: 'On first run, Jest creates the snapshot file and the test passes. Subsequent runs compare against that stored output.' },
    { q: 'What is the main risk of running jest --updateSnapshot without reviewing?', options: ['It deletes all existing snapshots', 'You accept bugs as the new "correct" output — snapshots become a rubber stamp', 'It causes tests to run twice', 'It converts inline snapshots to file snapshots'], answer: 1, explanation: 'Updating without reviewing means any change — including regressions — is accepted. Always diff snapshots before updating them.' },
    { q: 'When should you use property matchers in toMatchSnapshot()?', options: ['Always — property matchers are more accurate', 'When the value contains dynamic fields (UUIDs, timestamps) that change every run', 'When the snapshot file is too large', 'When you do not care about the output at all'], answer: 1, explanation: 'Dynamic values (IDs, dates, random tokens) cause snapshot failures on every run. Property matchers replace them with type-based expectations (expect.any(String)) so the test remains meaningful.' },
  { q: 'What is snapshot testing?', options: ['Performance benchmarking', 'Capturing rendered output and comparing it to a stored reference on subsequent runs', 'Screenshot comparison', 'Comparing database states'], answer: 1, explanation: 'Snapshot tests serialize a component\'s rendered output (typically to JSON or HTML). On subsequent runs, the output is compared to the stored snapshot — any diff causes the test to fail, prompting deliberate review.' },
  { q: 'When should you update a snapshot?', options: ['Never — snapshots are immutable', 'When the UI change is intentional and reviewed — run jest --updateSnapshot', 'Automatically on every test run', 'Only when the test file changes'], answer: 1, explanation: 'Update snapshots when the change is intentional: run jest --updateSnapshot (or jest -u). Always review the diff before updating — an unintentional change in a snapshot is a regression, not something to auto-accept.' },
  { q: 'What is inline snapshot testing?', options: ['Taking screenshots inline in tests', 'Storing the snapshot string directly in the test file using toMatchInlineSnapshot()', 'Comparing component props inline', 'Jest running snapshots without saving files'], answer: 1, explanation: 'toMatchInlineSnapshot() automatically populates the snapshot string inside the test file on first run. Easier to review during code review since the snapshot is colocated with the test.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use file snapshots or inline snapshots?', a: 'Inline snapshots (toMatchInlineSnapshot) are better for small, focused outputs — the reviewer can see the expected value without opening a separate .snap file. File snapshots are appropriate for large HTML trees or objects where the inline string would be too long. When in doubt, prefer inline.' },
    { q: 'When should I NOT use snapshot tests?', a: 'Avoid snapshots for: rapidly-evolving UI (the snapshot changes too often), dynamic data without property matchers, large entire-page renders (too much noise), and behaviour verification. Use interaction tests for behaviour and visual regression tools (Chromatic, Percy) for pixel-level UI verification.' },
    { q: 'How do I handle snapshot drift in a large codebase?', a: 'Run jest --ci (fails on outdated snapshots rather than updating) in CI. Review all snapshot diffs in PRs. Periodically audit stale snapshots with jest --verbose and delete ones that are no longer meaningful. Consider converting large file snapshots to inline snapshots for better reviewability.' },
  { q: 'What are the drawbacks of over-relying on snapshot tests?', a: 'Drawbacks: (1) <strong>Noisy diffs</strong>: any UI change (even cosmetic) breaks snapshots, requiring frequent updates; (2) <strong>Low signal</strong>: developers auto-accept snapshots without reviewing; (3) <strong>Large files</strong>: snapshot files bloat over time; (4) <strong>Test rot</strong>: snapshots become stale and are no longer meaningful. Best used sparingly for stable, complex serialised output (e.g. GraphQL responses, API contracts).' },
  { q: 'How do you use custom serializers in Jest snapshots?', a: 'Add custom serializers in jest.config.js: snapshotSerializers: [\'enzyme-to-json/serializer\'] for Enzyme. For custom: xpect.addSnapshotSerializer({ test: val => val && val.type === \'custom\', print: val => JSON.stringify(val, null, 2) }). Serializers control how values are converted to snapshot strings — useful for hiding volatile fields like timestamps.' },
  { q: 'How do you exclude volatile data from snapshots?', a: 'Use xpect.any(Date) or xpect.any(String) in snapshot matchers: xpect(obj).toMatchSnapshot({ createdAt: expect.any(String), id: expect.any(Number) }). Or replace volatile fields before snapshotting: const snapshot = { ...response, timestamp: \'[DATE]\', id: \'[ID]\' }; expect(snapshot).toMatchSnapshot(). This prevents flaky snapshot failures from timestamps.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Snapshots auto-capture serialisable output on first run and fail when it changes — useful for stable structures, noise for dynamic UIs.',
    mustKnow: [
      'toMatchSnapshot(): creates .snap file on first run, diffs on subsequent runs',
      'toMatchInlineSnapshot(): snapshot stored as a string in the test file',
      '--updateSnapshot: regenerates snapshots — always review diffs before accepting',
      'Property matchers for dynamic values: { id: expect.any(String) }',
      'Commit __snapshots__/ — they are part of the test',
      'Avoid large snapshots and snapshotting dynamic values',
    ],
    interviewFocus: [
      'How snapshot tests work and when they add value',
      'The danger of blind --updateSnapshot usage',
      'Property matchers for dynamic fields',
    ],
  };
}
