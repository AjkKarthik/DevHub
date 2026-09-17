import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-union-selection-sets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './union-selection-sets.html',
  styleUrl: './union-selection-sets.scss',
})
export class UnionSelectionSetsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'An unmatched fragment yields an empty object, not an error',
      points: [
        'A fragment-only union query like <code>search { ... on Post { title } }</code> against a <code>User</code> result does not raise a server error and does not crash.',
        'When execution reaches an inline fragment whose type condition does not match the runtime object, that fragment simply contributes nothing. With no other selections, the client receives an empty object <code>{}</code> for that result — a perfectly valid response, just an unusable one.',
        'The real problem is discrimination, not a crash: the client gets back objects it cannot tell apart, and <em>client</em> code that assumes every item has a <code>title</code> may then throw. Selecting <code>__typename</code> plus one fragment per member is what makes the response self-describing.',
      ],
    },
    {
      heading: 'A union declares no fields of its own',
      points: [
        'The theory calls a union "purely a one-of-these-types marker" — which also means the union type itself has an empty field set. The only field you may select directly on a union is the built-in <code>__typename</code>.',
        'You cannot select <code>id</code> directly on <code>SearchResult</code> even though <code>Post</code>, <code>User</code>, and <code>Tag</code> all declare an <code>id</code> field. There is no <code>id</code> on the union — every non-<code>__typename</code> field must be reached through a fragment (<code>... on Post { id }</code>).',
        'This is the practical difference from an <code>interface</code>: an interface names shared fields, so <code>... on Node { id }</code> works and you can select <code>id</code> straight off a <code>Node</code>-typed field. A union names no shared fields, so there is nothing to select without a fragment.',
        'A union selection set also may not be empty. It must contain at least one of: <code>__typename</code>, an inline fragment, or a named fragment spread.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What an unmatched member returns',
      language: 'typescript',
      code: `// Models field collection over a union result: fragments run only when
// their type condition equals the runtime type; nothing else contributes.
type Selection =
  | { typename: true }
  | { onType: string; fields: string[] };

function collectUnionFields(runtimeType: string, selection: Selection[]) {
  const out: Record<string, unknown> = {};
  for (const sel of selection) {
    if ('typename' in sel) {
      out['__typename'] = runtimeType;
    } else if (sel.onType === runtimeType) {
      for (const f of sel.fields) out[f] = runtimeType + '.' + f;
    }
    // fragment whose onType != runtimeType: skipped, adds nothing
  }
  return out;
}

// A search() call returns a User at runtime.
const runtime = 'User';

console.log(collectUnionFields(runtime, [{ onType: 'Post', fields: ['title'] }]));
// {}   <- not a crash: the Post fragment just did not apply

console.log(collectUnionFields(runtime, [
  { typename: true },
  { onType: 'Post', fields: ['title'] },
  { onType: 'User', fields: ['name'] },
]));
// { __typename: 'User', name: 'User.name' }   <- now the client can discriminate`,
    },
    {
      label: 'Why a bare field fails validation',
      language: 'typescript',
      code: `// Validation resolves each selected field against the SCOPED type of the
// selection set. For a union, the scoped type has no fields except __typename.
type FieldSet = Record<string, string>;
const schema: Record<string, FieldSet> = {
  Post: { id: 'ID!', title: 'String!' },
  User: { id: 'ID!', name: 'String!' },
  Tag:  { id: 'ID!', name: 'String!' },
  // SearchResult (a union) has NO entry here -- it declares nothing.
};
const unionMembers = ['Post', 'User', 'Tag'];

function validateDirectField(scopedType: string, fieldName: string) {
  if (fieldName === '__typename') return 'ok';
  const isUnion = !schema[scopedType];
  if (isUnion)
    return 'Cannot query field "' + fieldName + '" on type "' + scopedType +
           '". Did you mean an inline fragment on ' + unionMembers.join(', ') + '?';
  return schema[scopedType][fieldName] ? 'ok' : 'no such field ' + fieldName;
}

console.log(validateDirectField('SearchResult', '__typename')); // 'ok'
console.log(validateDirectField('SearchResult', 'id'));
// Cannot query field "id" on type "SearchResult".
// Did you mean an inline fragment on Post, User, Tag?

// The same field IS selectable one level down, inside a fragment:
console.log(validateDirectField('Post', 'id')); // 'ok'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A schema has <code>union Media = Photo | Video</code>, where <code>Photo</code> and <code>Video</code> both declare <code>url: String!</code> and <code>caption: String</code>. A teammate writes <code>{ media { url caption } }</code> to avoid "repeating myself in two fragments". Does this query validate? What is the smallest correct rewrite?',
    hint: 'The union type Media itself — is url one of its fields?',
    solution: `It does NOT validate. url and caption are fields of Photo and Video, not of Media. The union type declares no fields at all, so selecting url or caption directly on a Media-typed field is a validation error ("Cannot query field url on type Media").

There is no way to share the selection across members without a fragment. The smallest correct rewrite repeats the fields once per member:

  { media { __typename ... on Photo { url caption } ... on Video { url caption } } }

If the repetition genuinely bothers you, factor the shared fields into a named fragment and spread it into each member, or model Media as an interface instead of a union -- an interface CAN declare url and caption as shared fields, and then { media { url caption } } validates directly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If the runtime type matches no fragment in my union selection, the query errors."',
      reality: 'It does not. The non-matching fragments contribute nothing and you get an empty object <code>{}</code> for that result. No server error is raised — the response is valid, just undiscriminated. Adding <code>__typename</code> and a fragment per member is what fixes it.',
    },
    {
      thought: '"Since every member of my union has an <code>id</code> field, I can just select <code>id</code> on the union directly."',
      reality: 'A union type has no fields of its own — that shared <code>id</code> lives on each <em>member</em>, not on the union. You must select it through a fragment (<code>... on Post { id }</code>). Only an <code>interface</code> can expose shared fields for direct selection.',
    },
    {
      thought: '"A union selection set can be left empty if I only care about which type came back."',
      reality: 'An empty selection set is invalid. To ask only "which type is this?" you still need at least <code>__typename</code> in the set: <code>search { __typename }</code>.',
    },
  ];

  topicLabel = 'Schema Definition Language';
  topicRoute = '/graphql/schema-definition-language';
  prev: SubtopicLink | null = {
    label: 'A Non-Null Argument With a Default Value Is Not Required',
    route: '/graphql/schema-definition-language/non-null-arg-with-default-not-required',
  };
  next: SubtopicLink | null = {
    label: 'Custom Scalars: serialize, parseValue, and parseLiteral',
    route: '/graphql/schema-definition-language/custom-scalar-hooks',
  };
}
