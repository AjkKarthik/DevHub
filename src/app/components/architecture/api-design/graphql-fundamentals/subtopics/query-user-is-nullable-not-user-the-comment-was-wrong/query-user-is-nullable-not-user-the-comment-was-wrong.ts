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
    heading: 'The Comment Assumed a Schema Type the Page’s Own Schema Doesn’t Have',
    points: [
      'The main page’s own third mistake block ("Returning null instead of an error") justified throwing an explicit error with the inline comment "field is User! (non-null) so null would error anyway." But the page’s own SDL schema, in its very first codeTab, declares <code>type Query { user(id: ID!): User ... }</code> — <code>Query.user</code> returns plain <code>User</code>, WITHOUT the <code>!</code>. It is nullable, not non-null.',
      'This matters because GraphQL treats the two cases completely differently: returning <code>null</code> from a NON-NULL field (<code>User!</code>) triggers an automatic execution error that bubbles up to the nearest nullable ancestor. Returning <code>null</code> from an already-NULLABLE field (plain <code>User</code>) is perfectly valid execution — the client simply gets <code>{ data: { user: null } }</code>, no error at all.',
      'The mistake block’s underlying TEACHING POINT was never wrong — throwing an explicit, coded error genuinely does give clients more useful information than a bare <code>null</code>, exactly as the block’s own <code>explanation</code> field states for nullable fields ("clients can distinguish \'not found\' from \'permission denied\' from \'server error\'"). Only the inline CODE COMMENT’s specific justification (claiming this particular field would error anyway) was inaccurate.',
      'This has now been fixed on the main page — the comment correctly states <code>Query.user</code> is nullable, and reframes the reasoning around the real benefit (explicit, distinguishable error codes) rather than a made-up automatic-error guarantee that doesn’t apply to this field.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Simulating GraphQL Null Propagation',
    language: 'typescript',
    code: `// A minimal simulation of GraphQL's own null-propagation rule:
// - Non-null field + null resolver result -> execution ERROR
// - Nullable field + null resolver result -> perfectly valid, no error
function executeField(fieldName: string, isNonNull: boolean, resolverReturnsNull: boolean) {
  const value = resolverReturnsNull ? null : { id: '42' };
  if (value === null) {
    if (isNonNull) {
      return { error: \`Cannot return null for non-nullable field \${fieldName}\` };
    }
    return { data: null }; // valid -- no error
  }
  return { data: value };
}

// Query.user in THIS page's OWN schema: "user(id: ID!): User" -- nullable.
console.log(
  'Query.user (nullable, matches this page\\'s real schema):',
  executeField('Query.user', false, true)
);
// { data: null } -- no error. The original comment's claim was wrong
// for THIS specific field.

// A hypothetical Query.user: User! -- non-null, which the ORIGINAL
// comment seems to have assumed applied here.
console.log(
  'Query.user (hypothetical non-null):',
  executeField('Query.user', true, true)
);
// { error: 'Cannot return null for non-nullable field Query.user' }
// -- THIS is the case the original comment was actually describing --
// just not the schema the page actually declares.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Given that <code>Query.user</code> really is nullable in this page’s own schema (so a bare <code>null</code> would execute perfectly validly, with no automatic error), why does the fixed resolver still bother throwing an explicit <code>GraphQLError</code> at all — wouldn’t simply returning <code>null</code> and letting the field stay nullable be simpler and equally correct?',
  hint: 'What does a client actually SEE in the response for <code>{ data: { user: null } }</code> versus <code>{ data: { user: null }, errors: [{ message: \'User not found\', extensions: { code: \'NOT_FOUND\' } }] }</code> — and can the client tell the difference between "not found" and "you\'re not allowed to see this" from the first response alone?',
  solution: `// Both versions are syntactically "correct" GraphQL -- a nullable
// field returning null never breaks execution. The difference is
// entirely about how much INFORMATION the client actually gets back.

// A bare "user: null" response tells the client absolutely nothing
// about WHY there's no user -- it could mean "no user with that ID
// exists," "you don't have permission to see this user," or even "the
// database query itself failed silently." All three collapse into the
// identical { data: { user: null } } shape, with no error array at
// all, leaving the client to guess.

// The fixed resolver's explicit throw adds a SEPARATE errors array
// entry with an extensions.code ('NOT_FOUND') the client can branch on
// directly -- distinguishing "not found" from "permission denied" from
// "server error" the same way the main page's own explanation field
// already states as the real benefit. The field staying nullable in
// the schema is still correct and necessary (a "not found" result
// genuinely has no User to return), but the explicit error is what
// makes the RESPONSE actually informative rather than just valid.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A field marked with <code>!</code> in GraphQL SDL (like <code>User!</code>) behaves the same as a field without it (<code>User</code>) — the exclamation mark is just documentation.',
    reality: 'The codeTab above demonstrates a real, executable difference: a resolver returning <code>null</code> for a <code>User!</code> field triggers an automatic GraphQL execution ERROR that propagates up the response tree, while the identical <code>null</code> return from a plain <code>User</code> field is completely valid, error-free execution. This is enforced by the GraphQL execution engine itself, not a convention.',
  },
  {
    thought: 'Since the main page’s mistake block’s underlying advice (throw explicit errors instead of returning null) was correct, the inaccurate inline comment didn’t really matter.',
    reality: 'The ADVICE was correct, but a wrong justification attached to correct advice is still a real inaccuracy worth fixing — a reader cross-checking the comment against the page’s own displayed schema (as this subtopic does) would find a factual claim that doesn’t hold, which undermines trust in the surrounding explanation even where the surrounding explanation itself is right.',
  },
  {
    thought: 'Checking whether a mistake-block’s inline code comment is accurate requires external research into GraphQL specification details.',
    reality: 'This particular inaccuracy was catchable with ZERO external research — simply comparing the mistake block’s own comment (claiming <code>Query.user</code> is <code>User!</code>) against the SAME page’s own first codeTab, which explicitly declares <code>user(id: ID!): User</code> a few sections earlier. Self-contained cross-checks like this — comparing one part of a page against another part of the SAME page — catch a surprising number of real inaccuracies without needing to consult any outside source.',
  },
];

@Component({
  selector: 'app-api-graphql-nullable-user',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './query-user-is-nullable-not-user-the-comment-was-wrong.html',
  styleUrl: './query-user-is-nullable-not-user-the-comment-was-wrong.scss',
})
export class QueryUserIsNullableNotUserTheCommentWasWrongSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
