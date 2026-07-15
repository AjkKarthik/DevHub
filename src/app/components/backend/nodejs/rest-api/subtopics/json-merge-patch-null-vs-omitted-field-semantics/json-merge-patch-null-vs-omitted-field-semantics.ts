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
  templateUrl: './json-merge-patch-null-vs-omitted-field-semantics.html',
  styleUrl: './json-merge-patch-null-vs-omitted-field-semantics.scss'
})
export class JsonMergePatchNullVsOmittedFieldSemanticsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "PUT for full replace, PATCH for partial update" — but a naive PATCH body { name: null } is genuinely ambiguous unless a specific patch format defines what null means',
      points: [
        'The most common convention for a partial-update PATCH body — matching Content-Type: application/merge-patch+json, formalized as RFC 7396 JSON Merge Patch — is: a field explicitly present in the patch body with value null means "delete this field from the target." A field simply not mentioned in the patch body at all means "leave this field completely unchanged." These are two DIFFERENT instructions that look easy to conflate when writing the handler.',
        'RFC 7396 states this design directly: merge patch is "not appropriate for all JSON syntaxes" — specifically, it cannot represent "set this field\'s actual value to the JSON literal null" for a field that is meant to genuinely BE nullable (e.g. a "middleName" field where null legitimately means "this person has no middle name," as opposed to "delete the middleName field from the record entirely, as if it were never set").',
        'This is not a hypothetical edge case — it is the exact scenario a naive Object.assign(existingRecord, req.body) PATCH handler gets wrong: JavaScript\'s own object-merge semantics treat null as "just a value," so Object.assign happily sets the field to null, but never DELETES a key that way — meaning a naive handler silently fails to implement the delete-on-null convention at all, even if the API documentation claims to follow it.',
      ]
    },
    {
      heading: 'Two ways real APIs resolve the ambiguity — pick one deliberately, don\'t leave it implicit',
      points: [
        'Adopt JSON Merge Patch\'s convention explicitly and document it: null in the request body always means delete/reset-to-default for that field, never "set to the literal value null." Any field that must be settable to an actual null value needs a different mechanism — a separate sentinel value, or a wrapper object like { value: null, isSet: true }.',
        'Or use JSON Patch (RFC 6902) instead of Merge Patch — a completely different format using an array of explicit operations like [{ "op": "replace", "path": "/middleName", "value": null }] or [{ "op": "remove", "path": "/middleName" }]. This resolves the ambiguity because "replace with null" and "remove the field" are syntactically distinct operations, at the cost of a much more verbose, less human-writable request body than a plain partial JSON object.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive handler gets it wrong',
      language: 'typescript',
      code: `// PATCH /users/42  body: { "middleName": null }
router.patch('/:id', async (req, res) => {
  const user = await usersRepo.findById(req.params.id);

  // WRONG: this just assigns the literal value null to the field.
  // It does NOT implement "delete this field" semantics — and if
  // the DB column is NOT NULL, this now throws a constraint error
  // for a request that was only trying to clear an optional field.
  Object.assign(user, req.body);
  await usersRepo.save(user);
  res.json(user);
});

// A second, silent bug in the SAME naive handler:
// PATCH /users/42  body: { "name": "Alex" }
// Object.assign only touches keys PRESENT in req.body — so omitted
// fields are correctly left alone here. That part accidentally works.
// The null case is the one that breaks, because JS has no built-in
// "null means delete the key" merge behavior.`,
    },
    {
      label: 'Explicit JSON Merge Patch semantics (RFC 7396)',
      language: 'typescript',
      code: `// PATCH /users/42  Content-Type: application/merge-patch+json
// body: { "middleName": null, "nickname": "Al" }
router.patch('/:id', async (req, res) => {
  const user = await usersRepo.findById(req.params.id);
  const patch = req.body;

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete user[key];        // null => remove the field entirely
    } else {
      user[key] = value;       // present + non-null => set it
    }
    // any key NOT in "patch" at all is untouched automatically,
    // since we only iterate Object.entries(patch)
  }

  await usersRepo.save(user);
  res.json(user);
});

// Result for { middleName: null, nickname: "Al" }:
// - middleName key is deleted from the record
// - nickname is set to "Al"
// - every other field (name, email, ...) is left exactly as it was`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "userPreferences" resource has an optional "timezone" field that can legitimately be set to null (meaning "use the browser\'s local timezone" — a real, meaningful value, not "unset"). A client sends PATCH { "timezone": null } expecting the field to be SET to null. Using plain JSON Merge Patch semantics as described in this subtopic, what actually happens to the "timezone" field, and why does this design fail for this specific field?',
    hint: 'Under JSON Merge Patch, what does an explicit null value in the patch body always mean, regardless of what the field is semantically supposed to represent?',
    solution: 'Under strict JSON Merge Patch semantics, { "timezone": null } means "delete the timezone field from the record" — not "set timezone to the value null." So the field would be removed entirely rather than being set to the meaningful null value the client intended. This is exactly the failure mode RFC 7396 itself acknowledges: merge patch is not appropriate for JSON documents that need to represent an explicit null as a real, distinct value from "field absent." For a field like "timezone" where null is a legitimate, meaningful state, the API needs a different mechanism — either document that this specific field uses a different sentinel (e.g. the string "auto" instead of null) to mean "use browser default," or abandon Merge Patch for this resource and use full JSON Patch (RFC 6902) instead, where { "op": "replace", "path": "/timezone", "value": null } and { "op": "remove", "path": "/timezone" } are two syntactically distinct, unambiguous operations.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A PATCH request body is just "the fields you want to change," and setting a field to null in that body naturally means "set this field\'s value to null."',
      reality: 'This subtopic\'s theory shows the widely-used JSON Merge Patch convention (RFC 7396) defines null in the patch body to mean "delete this field," which is a genuinely different instruction from "set the value to null" — the two are easy to conflate but are not the same operation.'
    },
    {
      thought: 'Using <code>Object.assign(existingRecord, req.body)</code> is a safe, complete way to implement a PATCH partial-update handler in JavaScript.',
      reality: 'This subtopic\'s code example shows Object.assign correctly leaves omitted fields untouched, but it has no concept of "null means delete" at all — it just assigns the literal null value to the key, which can violate a NOT NULL database constraint or silently fail to implement the delete-on-null convention the API claims to follow.'
    },
    {
      thought: 'JSON Merge Patch (RFC 7396) can represent any partial update, including explicitly setting any field — including nullable ones — to the value null.',
      reality: 'This subtopic\'s exercise shows the opposite: RFC 7396 itself documents that Merge Patch is unsuitable for JSON documents needing a genuine, meaningful null value distinct from "field absent" — a resource with a legitimately-nullable field needs a different mechanism (a sentinel value, or full JSON Patch/RFC 6902 instead) to represent that case correctly.'
    }
  ];
}
