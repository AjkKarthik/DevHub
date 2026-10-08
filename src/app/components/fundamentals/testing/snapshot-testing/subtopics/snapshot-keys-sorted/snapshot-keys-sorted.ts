import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-snapshot-keys-sorted',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './snapshot-keys-sorted.html',
  styleUrl: './snapshot-keys-sorted.scss'
})
export class SnapshotKeysSortedSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the serializer does",
      "points": [
        "The Object Snapshot tab parses a YAML string with <code>server</code> first and <code>db</code> second, then shows an inline snapshot with <code>\"db\"</code> first. Within <code>server</code>, <code>host</code> also appears before <code>port</code>.",
        "Checked with pretty-format: formatting <code>{ server: { port: 3000, host: \"localhost\" }, db: { pool: 5 } }</code> printed <code>db</code> before <code>server</code> and <code>host</code> before <code>port</code>, exactly as the page shows.",
        "Arrays are not sorted: <code>[3, 1, 2]</code> stayed in that order. A <code>Map</code> with keys b then a also stayed b then a, because insertion order is part of a Map's meaning.",
        "So snapshots are deliberately insensitive to object key order. That keeps them stable, but it also means a snapshot cannot catch a bug where key order matters."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured with pretty-format",
      "language": "typescript",
      "code": "import { format } from 'pretty-format';\n\nformat({ server: { port: 3000, host: 'localhost' }, db: { pool: 5 } });\n// {\n//   \"db\": { \"pool\": 5 },\n//   \"server\": { \"host\": \"localhost\", \"port\": 3000 },\n// }\n\nformat([3, 1, 2]);                     // [3, 1, 2]    (order kept)\nformat(new Map([['b', 1], ['a', 2]]));  // Map { b => 1, a => 2 }   (order kept)"
    },
    {
      "label": "When order matters",
      "language": "typescript",
      "code": "test('CSV columns keep their declared order', () => {\n  const row = toCsvRow({ id: 1, name: 'Alice', email: 'a@x.io' });\n  expect(Object.keys(row)).toEqual(['id', 'name', 'email']);  // explicit\n  expect(row).toMatchSnapshot();                              // values\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A refactor changes a function to build its result object with keys in a different order. Does its existing <code>toMatchSnapshot()</code> test fail?",
    "hint": "Think about what the serializer does before comparing.",
    "solution": "No. Object keys are sorted before the snapshot is written and compared, so the serialized output is identical. If the order matters, add an explicit assertion on Object.keys()."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "The snapshot shows keys in the order the code created them.",
      "reality": "pretty-format sorts plain object keys. Only arrays, Maps and Sets keep insertion order."
    },
    {
      "thought": "A passing snapshot proves the output is byte-for-byte the same.",
      "reality": "It proves the serialized form matches, and serialization normalises things such as key order."
    }
  ];
}
