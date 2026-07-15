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
  templateUrl: './response-schema-silently-strips-unlisted-fields-forgotten-ones-too.html',
  styleUrl: './response-schema-silently-strips-unlisted-fields-forgotten-ones-too.scss'
})
export class ResponseSchemaSilentlyStripsUnlistedFieldsForgottenOnesTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames response schema stripping as a SECURITY feature — worth also seeing the flip side, since the same mechanism has no way to distinguish "leaked secret" from "legitimate new field"',
      points: [
        'Fastify\'s quiz already confirms: fields not listed in a response schema are stripped, acting as a whitelist that prevents accidental data leakage (a password hash, an internal ID, an unexpected isAdmin field slipping into a response). This is a genuine, valuable security property, and it works precisely because fast-json-stringify only ever serializes the properties the schema explicitly declares — it has no concept of "this field is fine, just forgot to list it" versus "this field is genuinely sensitive."',
        'This means the exact same mechanism applies uniformly to ANY field not in the schema, regardless of why it\'s missing from the schema — whether that\'s a deliberately-omitted sensitive field (the intended security case) or a genuinely legitimate new field that a developer added to the underlying data model but forgot to also add to the response schema (an unintended, easy-to-miss bug).',
      ]
    },
    {
      heading: 'Why the "forgotten field" case is a genuinely different failure mode from a normal missing-property bug',
      points: [
        'A typical "forgot to include a field" bug elsewhere in an API would produce an obviously incomplete or malformed response, or an explicit error. Here, the response is completely well-formed JSON, passes any structural validation against ITS OWN schema perfectly (since the schema doesn\'t know the field should exist), and the API call succeeds with a 200/201 status — there is no error, warning, or failed test anywhere UNLESS a consumer specifically checks for that exact field\'s presence.',
        'This becomes a real, delayed-discovery bug pattern: a developer adds a new field to a database model and to the object their route handler returns, tests the change by checking the database directly or by logging the object BEFORE it\'s serialized, sees the field is there, and ships it — never noticing the response schema (a separate, easy-to-forget file/object) was never updated to include it, so the field silently vanishes specifically in the actual HTTP response every client receives.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A new field added to the handler, but not the schema — silently vanishes',
      language: 'typescript',
      code: `const userSchema = {
  type: 'object',
  properties: {
    id:    { type: 'string' },
    name:  { type: 'string' },
    email: { type: 'string' },
    // BUG: a new "role" field was added to the User model and to
    // the object returned below, but NEVER added here.
  },
};

fastify.get('/users/:id', {
  schema: { response: { 200: userSchema } },
}, async (request, reply) => {
  const user = await db.findUser(request.params.id);
  // user genuinely has { id, name, email, role: "admin" } — the
  // developer can verify this with a console.log right here and
  // see all four fields present.
  return user;
  // But the RESPONSE actually sent to the client only contains
  // id, name, and email — "role" is silently stripped by
  // fast-json-stringify, since it isn't in userSchema.properties.
  // No error. No warning. A perfectly valid 200 response, just
  // missing a field every client actually needs.
});`,
    },
    {
      label: 'The fix — the response schema must be updated alongside the data model',
      language: 'typescript',
      code: `const userSchema = {
  type: 'object',
  properties: {
    id:    { type: 'string' },
    name:  { type: 'string' },
    email: { type: 'string' },
    role:  { type: 'string' }, // added alongside the new field
  },
};

fastify.get('/users/:id', {
  schema: { response: { 200: userSchema } },
}, async (request, reply) => {
  const user = await db.findUser(request.params.id);
  return user; // "role" now correctly appears in the response
});

// Practical mitigation: treat the response schema as part of the
// SAME change as any new field added to a returned object — a code
// review checklist item, or a generated schema (TypeBox/Zod type
// provider) derived from the SAME type the handler returns, so
// the two can never drift apart in the first place.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds a new "role" field to their User database model and updates the route handler to include it in the returned object. They manually test by adding a console.log(user) right before the return statement and confirm role: "admin" is present. They ship the change. A few days later, a frontend developer reports the /users/:id endpoint "doesn\'t return the role field at all," even though the backend developer insists they tested it and saw the field present. Explain the disconnect, given that the backend developer\'s test genuinely did show the correct data.',
    hint: 'Does a console.log placed BEFORE the return statement observe the object as it exists in memory, or the object as it will actually appear in the final HTTP response after Fastify\'s response schema serialization runs on it?',
    solution: 'Both developers are correct about what they observed — the disconnect is that they were looking at two different stages of the same request. The backend developer\'s console.log runs BEFORE Fastify\'s response schema serialization — at that point, the in-memory user object genuinely does contain role: "admin", exactly as logged. But once the handler returns that object, fast-json-stringify serializes it using the ROUTE\'S response schema, which was never updated to include a role property. Since the schema acts as a strict whitelist, any field not explicitly listed is silently stripped during this serialization step, which happens entirely AFTER the point where the backend developer\'s console.log already observed the correct data. The frontend developer, receiving the actual final HTTP response, correctly sees no role field at all — not because the data was ever wrong, but because the response SCHEMA (a separate artifact from the handler\'s own logic) was never updated to match the new field. The fix is adding role to the response schema\'s properties, and more durably, treating schema updates as part of the same change whenever a returned object\'s shape changes, rather than testing only the in-memory data before serialization.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Fastify\'s response schema field-stripping only matters for security purposes (preventing accidental leaks) — it has no relevance to ordinary correctness bugs.',
      reality: 'This subtopic\'s theory clarifies the exact same stripping mechanism applies uniformly to ANY unlisted field, whether that\'s an intentionally-omitted sensitive field or an accidentally-forgotten legitimate one — the schema can\'t distinguish the two cases at all.'
    },
    {
      thought: 'If a route handler is confirmed (via logging or debugging) to return an object containing a specific field, that field is guaranteed to appear in the actual HTTP response sent to clients.',
      reality: 'This subtopic\'s exercise shows this guarantee doesn\'t hold when a response schema is defined — verifying the in-memory object before it\'s serialized says nothing about what survives the schema-driven serialization step that happens afterward.'
    },
    {
      thought: 'A missing field in an API response, with no error and a successful status code, is unlikely to be caused by response schema configuration — that would typically produce a validation error instead.',
      reality: 'This subtopic\'s theory shows Fastify\'s response schema stripping is fundamentally silent by design — an unlisted field never triggers a validation error because the schema only defines what SHOULD be serialized, not what\'s permitted to exist on the object being returned.'
    }
  ];
}
