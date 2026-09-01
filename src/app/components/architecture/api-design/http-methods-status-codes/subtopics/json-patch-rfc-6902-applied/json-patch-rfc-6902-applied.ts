import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Named as an Alternative PATCH Format — Never Shown as Real Syntax',
    points: [
      'Quiz Q4’s own explanation names JSON Patch (RFC 6902) precisely: "explicit operation list: [{ op: replace, path: /email, value: new@example.com }, { op: remove, path: /nickname }]. Atomic — all or none." No codeTab on the page ever shows a real JSON Patch document or applies one.',
      'Verified against RFC 6902 itself: every operation object requires <code>op</code> and <code>path</code>; <code>add</code>/<code>replace</code>/<code>test</code> additionally require <code>value</code>; <code>move</code>/<code>copy</code> additionally require <code>from</code>. <code>remove</code> needs neither <code>value</code> nor <code>from</code> — just the path to delete.',
      'The main page’s own theory names WHY this exists as an alternative to the field-replacement PATCH style everywhere else on the page: "Problem: cannot set a field to null (null vs absent)" — field-replacement PATCH can’t distinguish "this field wasn’t mentioned" from "set this field to null," while JSON Patch’s <code>remove</code> op and explicit <code>value: null</code> can.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real JSON Patch Document, Applied',
    language: 'typescript',
    code: `type JsonPatchOp =
  | { op: 'add' | 'replace' | 'test'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'move' | 'copy'; path: string; from: string };

function getByPath(obj: any, path: string): unknown {
  const keys = path.split('/').filter(Boolean);
  return keys.reduce((acc, k) => acc?.[k], obj);
}

function setByPath(obj: any, path: string, value: unknown): void {
  const keys = path.split('/').filter(Boolean);
  const last = keys.pop()!;
  const target = keys.reduce((acc, k) => acc[k], obj);
  target[last] = value;
}

function deleteByPath(obj: any, path: string): void {
  const keys = path.split('/').filter(Boolean);
  const last = keys.pop()!;
  const target = keys.reduce((acc, k) => acc[k], obj);
  delete target[last];
}

function applyJsonPatch(doc: any, patch: JsonPatchOp[]): any {
  const result = JSON.parse(JSON.stringify(doc)); // never mutate the input
  for (const operation of patch) {
    switch (operation.op) {
      case 'add':
      case 'replace':
        setByPath(result, operation.path, operation.value);
        break;
      case 'remove':
        deleteByPath(result, operation.path);
        break;
      case 'test':
        // Atomicity check -- if this fails, the WHOLE patch should be
        // rejected, none of it applied (illustrated in the exercise).
        if (getByPath(result, operation.path) !== operation.value) {
          throw new Error(\`Test failed at \${operation.path}\`);
        }
        break;
      case 'move':
        setByPath(result, operation.path, getByPath(result, operation.from));
        deleteByPath(result, operation.from);
        break;
      case 'copy':
        setByPath(result, operation.path, getByPath(result, operation.from));
        break;
    }
  }
  return result;
}

// The exact patch quiz Q4's own explanation describes, applied to a
// real document:
const user = { email: 'old@example.com', nickname: 'JD', role: 'user' };
const patch: JsonPatchOp[] = [
  { op: 'replace', path: '/email', value: 'new@example.com' },
  { op: 'remove', path: '/nickname' },
];
console.log(applyJsonPatch(user, patch));
// { email: 'new@example.com', role: 'user' } -- nickname is GONE
// entirely, not set to null or an empty string -- exactly the
// distinction field-replacement PATCH cannot express.

app.patch('/users/:id', authenticate, async (req, res) => {
  const current = await db.users.findById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const updated = applyJsonPatch(current, req.body as JsonPatchOp[]);
  await db.users.replace(req.params.id, updated);
  res.json(updated);
});`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client sends this patch: <code>[{ op: \'test\', path: \'/role\', value: \'user\' }, { op: \'replace\', path: \'/role\', value: \'admin\' }]</code> — meaning "only promote to admin if the current role is still user (nobody else changed it first)." Trace what <code>applyJsonPatch</code> does if the document’s <code>role</code> is ALREADY <code>\'admin\'</code> by the time this patch runs.',
  hint: 'Look at the <code>test</code> case in the switch statement above — what does it do when the comparison fails, and what happens to the function call as a whole?',
  solution: `// The 'test' operation compares the current value at /role
// ('admin') against the expected value ('user') -- they don't match,
// so applyJsonPatch throws an Error immediately, right there in the
// loop, BEFORE the second 'replace' operation ever runs.

// Because the function throws rather than returning a partially-
// modified result, the caller (the PATCH route handler) never
// reaches "await db.users.replace(...)" at all -- nothing gets
// persisted. This is exactly the "atomic -- all or none" property
// the main page's own quiz explanation names for JSON Patch: a
// failed test anywhere in the operation list aborts the ENTIRE
// patch, not just the operation that failed.

// This is a real, practical use of 'test': it lets a client express
// an optimistic-concurrency check (a poor man's ETag/If-Match) INSIDE
// the patch document itself, rather than as a separate header --
// "only apply my change if the resource is still in the state I
// expect it to be in."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'JSON Patch and field-replacement PATCH (the style used everywhere else on the main page) are just two different SYNTAXES for expressing the same set of possible updates.',
    reality: 'They have genuinely different EXPRESSIVE POWER, not just different syntax — field-replacement PATCH cannot distinguish "this field was not mentioned in the request" from "this field should be set to null," and cannot express operations like <code>move</code>/<code>copy</code> between paths, or an atomic <code>test</code>-then-<code>replace</code> sequence, at all.',
  },
  {
    thought: 'Every JSON Patch operation needs a "value" field — it’s just a matter of what gets removed or replaced.',
    reality: 'Only <code>add</code>, <code>replace</code>, and <code>test</code> require <code>value</code> (verified against RFC 6902 itself) — <code>remove</code> needs only a <code>path</code>, and <code>move</code>/<code>copy</code> need a <code>from</code> path instead of a value. Supplying a <code>value</code> for a <code>remove</code> operation is simply ignored by a correct implementation, not an error, but it reveals a misunderstanding of what each op actually needs.',
  },
  {
    thought: 'A "test" operation in a JSON Patch document is just a no-op assertion for debugging — it doesn’t affect whether the rest of the patch actually applies.',
    reality: 'A failing <code>test</code> operation aborts the ENTIRE patch application — the codeTab’s <code>applyJsonPatch</code> throws immediately, before any later operation in the same array runs, and the exercise above traces exactly how this makes <code>test</code> a real concurrency-control mechanism, not just a debugging aid.',
  },
];

@Component({
  selector: 'app-api-http-methods-json-patch',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './json-patch-rfc-6902-applied.html',
  styleUrl: './json-patch-rfc-6902-applied.scss',
})
export class JsonPatchRfc6902AppliedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
