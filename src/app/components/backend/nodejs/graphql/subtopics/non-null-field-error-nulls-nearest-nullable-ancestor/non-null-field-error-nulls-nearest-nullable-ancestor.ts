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
  templateUrl: './non-null-field-error-nulls-nearest-nullable-ancestor.html',
  styleUrl: './non-null-field-error-nulls-nearest-nullable-ancestor.scss'
})
export class NonNullFieldErrorNullsNearestNullableAncestorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory says "String! means the field can never be null — if the resolver returns null, GraphQL throws an error" — but it never explains what happens to the REST of the response when that error occurs',
      points: [
        'When a non-nullable field\'s resolver throws, or improperly returns null, GraphQL does not simply set that one field to null in the response — it CANNOT, because the schema promises that field will never be null. Instead, per the GraphQL specification\'s field-error-handling rules, the null is propagated UPWARD to the nearest ANCESTOR position in the response that is actually allowed to be null.',
        'The exact rule: if the immediate parent object\'s type allows null, the whole parent object becomes null (not just the one field), and the field-level error is still recorded in the response\'s errors array. If that parent is ALSO typed non-null, the nulling continues propagating up to ITS parent, and so on — potentially all the way to the top-level "data" field itself, which becomes entirely null if every position from the failing field up to the root happens to be non-null.',
        'This means a single failing field deep inside a heavily non-null-typed schema can silently wipe out a much larger portion of the response than that one field — an entire nested object, or even the whole query\'s data — while the errors array still correctly points at exactly which field actually failed.',
      ]
    },
    {
      heading: 'Why schema design choices directly control the blast radius of this behavior',
      points: [
        'This is a genuine, spec-mandated behavior — not a bug in any particular server implementation. Apollo Server, GraphQL Yoga, and every spec-compliant GraphQL server implement this identically, because it is defined at the specification level, not left up to individual implementations.',
        'The practical schema-design lesson: marking a field non-null (String!) is a promise to clients that simplifies their code (no null-checking needed) — but it also means that ANY failure in that field\'s resolver has a blast radius that can propagate well beyond the field itself. A field that might occasionally, legitimately fail (e.g. an external API call) is often a better candidate for a NULLABLE type specifically so a failure there stays contained to just that one field, rather than nulling out a larger object.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Null propagates through multiple non-null layers',
      language: 'typescript',
      code: `const typeDefs = \`#graphql
  type Author { id: ID! name: String! }
  type Post {
    id: ID!
    title: String!
    author: Author!    # non-null — a failure here nulls the WHOLE Post
  }
  type Query {
    post(id: ID!): Post   # nullable — the propagation can stop HERE
  }
\`;

const resolvers = {
  Query: { post: (_, { id }, ctx) => ctx.db.posts.findById(id) },
  Post: {
    author: (post, _, ctx) => {
      // Throws (e.g. author service is down). Since Post.author is
      // non-null, this null CANNOT be assigned to just the author
      // field — it propagates up to the nearest nullable ancestor.
      throw new Error('Author service unavailable');
    },
  },
};

// Query: { post(id: "1") { id title author { name } } }
// Response — the ENTIRE post object is null, not just author:
{
  "data": { "post": null },
  "errors": [{
    "message": "Author service unavailable",
    "path": ["post", "author"]   // path shows exactly WHERE it failed
  }]
}
// Query.post is nullable, so propagation stops there — "data" itself
// still has a usable (if null) "post" key, not a fully-null "data".`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the schema `type Query { viewer: Viewer! } type Viewer { profile: Profile! } type Profile { bio: String }`, a resolver for Profile.bio throws an error. Trace exactly what the top-level "data" value in the response will be, and explain why, using the null-propagation rule.',
    hint: 'Is Profile.bio itself nullable or non-null? If a field is nullable, does an error in it propagate any further up, or does it just become null in place?',
    solution: 'The top-level "data" value will be { "viewer": { "profile": { "bio": null } } } — the null stays completely LOCAL to the bio field and does NOT propagate anywhere. This is because Profile.bio is typed as plain "String" (nullable, no ! suffix) in the given schema — the propagation rule only kicks in when a field that IS non-null cannot have its error represented as "just set this field to null," forcing the null to move up to the nearest position that CAN legally be null. Since bio itself is already nullable, it IS the nearest nullable position — the error stops right there, Profile and Viewer and the top-level data all remain fully intact and non-null, and only the errors array records that Profile.bio specifically failed. This is deliberately the opposite outcome from the code example, which used a NON-null Post.author field to show propagation actually spreading upward — the schema\'s own nullability choice is what determines whether a single field failure stays contained or wipes out a larger part of the response.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a resolver for a non-nullable field (e.g. String!) throws an error, GraphQL simply sets that one field to null in the response, the same way it would for a nullable field.',
      reality: 'This subtopic\'s theory and code example both show this is impossible by definition — a non-null field cannot legally be null in the response, so the null is instead propagated UP to the nearest ancestor position that is actually allowed to be null, potentially nulling out an entire parent object or more.'
    },
    {
      thought: 'Null propagation from a failing non-null field is a quirk or bug specific to certain GraphQL server implementations like Apollo Server.',
      reality: 'This subtopic\'s theory clarifies this is defined at the GraphQL SPECIFICATION level itself — every spec-compliant server (Apollo Server, GraphQL Yoga, and others) implements this identically, since it is a mandated part of how the spec defines field error handling, not an implementation choice.'
    },
    {
      thought: 'Marking more fields as non-null (String! instead of String) is always a strictly safer, better schema design choice, since it guarantees clients never have to null-check those fields.',
      reality: 'This subtopic\'s theory shows the tradeoff cuts the other way for fields that can legitimately fail — a non-null field\'s failure has a larger, spreading blast radius (potentially nulling an entire parent object), while a nullable field\'s failure stays contained to exactly that one field.'
    }
  ];
}
