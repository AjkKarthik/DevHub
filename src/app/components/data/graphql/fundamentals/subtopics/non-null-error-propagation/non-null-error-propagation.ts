import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-non-null-error-propagation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './non-null-error-propagation.html',
  styleUrl: './non-null-error-propagation.scss',
})
export class NonNullErrorPropagationSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page states half the rule',
      points: [
        'The main page\'s Type System section says: "A field returning null when declared non-null crashes the response at that node." That is the trigger, but not what actually happens next.',
        'Per the GraphQL spec, when a non-null field resolves null (or its resolver throws), a field error is recorded AND the null is pushed up to the parent field. If the parent is also non-null, the null bubbles up again. It keeps climbing until it reaches a field that IS nullable — which becomes null — or reaches the root, in which case the entire <code>data</code> is null.',
        'This is why non-null (<code>!</code>) is sometimes called "kills parent on exception". A single failing leaf can erase a large, otherwise-healthy subtree.',
        'The errors array still carries the original failure with its full <code>path</code> (e.g. <code>["user", "account", "displayName"]</code>), so a client can see exactly where the null originated even though the visible null appears higher up.',
      ],
    },
    {
      heading: 'Why this matters for schema design',
      points: [
        'Marking a field non-null is a promise that it can always be resolved. If a field genuinely can fail — a lookup to a flaky downstream service, a field that is sometimes legitimately absent — making it non-null converts a local, recoverable null into a cascading outage for that branch of the query.',
        'The safe default in many production schemas is: mark scalars like <code>id</code> non-null (they really are always present), but keep object relationships and derived fields nullable unless you are certain. A nullable field that occasionally returns null degrades gracefully; a non-null one that occasionally returns null takes its parent down with it.',
        'The <code>Post.author</code> field added in the previous subtopic is a reasonable non-null: a published post always has an author. But if the author lookup itself is unreliable, that <code>!</code> means one failed user fetch nulls the whole <code>Post</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A minimal bubbling executor',
      language: 'typescript',
      code: `type SchemaMap = Record<string, Record<string, string>>;
type Resolvers = Record<string, (parent: any) => any>;

// Returns { value } on success or { error } when a non-null field failed
// and the null must bubble past this node.
function execField(schema: SchemaMap, typeName: string, field: any, resolvers: Resolvers, parent: any, path: string[]): any {
  const fieldType = schema[typeName][field.name];
  const nonNull = fieldType.endsWith('!');
  const named = fieldType.replace(/[![\\]]/g, '');
  const key = \`\${typeName}.\${field.name}\`;

  let raw: any;
  try {
    raw = resolvers[key] ? resolvers[key](parent) : parent?.[field.name] ?? null;
  } catch (e: any) {
    return nonNull ? { error: { message: e.message, path } } : { value: null };
  }
  if (raw == null) {
    return nonNull
      ? { error: { message: \`Cannot return null for non-nullable field \${key}.\`, path } }
      : { value: null };
  }
  if (!field.sel) return { value: raw };

  const obj: any = {};
  for (const sub of field.sel) {
    const r = execField(schema, named, sub, resolvers, raw, [...path, sub.name]);
    if (r.error) {
      const subNonNull = schema[named][sub.name].endsWith('!');
      if (subNonNull) {
        // the sub-field was non-null -> its null bubbles into US
        return nonNull ? { error: r.error } : { value: null, error: r.error };
      }
      obj[sub.name] = null;
    } else {
      obj[sub.name] = r.value;
    }
  }
  return { value: obj };
}

function execute(schema: SchemaMap, root: string, selection: any[], resolvers: Resolvers) {
  const data: any = {};
  const errors: any[] = [];
  for (const field of selection) {
    const r = execField(schema, root, field, resolvers, null, [field.name]);
    if (r.error) {
      errors.push(r.error);
      if (schema[root][field.name].endsWith('!')) return { data: null, errors };
      data[field.name] = null;
    } else {
      data[field.name] = r.value;
      if (r.error) errors.push(r.error);
    }
  }
  return { data, errors: errors.length ? errors : undefined };
}`,
    },
    {
      label: 'The bubble in action',
      language: 'typescript',
      code: `const schema = {
  Query:   { user: 'User' },            // user is NULLABLE
  User:    { id: 'ID!', name: 'String!', account: 'Account!' },  // account NON-NULL
  Account: { id: 'ID!', displayName: 'String!' },                // displayName NON-NULL
};
const selection = [{ name: 'user', sel: [
  { name: 'name' },
  { name: 'account', sel: [{ name: 'displayName' }] },
]}];

// displayName resolver returns null. It is non-null -> field error.
// account is non-null -> null bubbles past it.
// user is NULLABLE -> it absorbs the bubble and becomes null.
console.log(JSON.stringify(execute(schema, 'Query', selection, {
  'Query.user': () => ({ id: '1', name: 'Alice', account: { id: 'a1', displayName: null } }),
})));
// {"data":{"user":null},
//  "errors":[{"message":"Cannot return null for non-nullable field Account.displayName.",
//             "path":["user","account","displayName"]}]}

// Same failure, but now Query.user is NON-NULL (User!):
// the bubble reaches the root -> the whole data is null.
const strict = { ...schema, Query: { user: 'User!' } };
console.log(JSON.stringify(execute(strict, 'Query', selection, {
  'Query.user': () => ({ id: '1', name: 'Alice', account: { id: 'a1', displayName: null } }),
})));
// {"data":null,
//  "errors":[{"message":"Cannot return null for non-nullable field Account.displayName.",
//             "path":["user","account","displayName"]}]}

// Nothing fails -> ordinary result, no bubble.
console.log(JSON.stringify(execute(schema, 'Query', selection, {
  'Query.user': () => ({ id: '1', name: 'Alice', account: { id: 'a1', displayName: 'Alice A.' } }),
})));
// {"data":{"user":{"name":"Alice","account":{"displayName":"Alice A."}}}}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You have a <code>Query.dashboard: Dashboard!</code> that returns a large object with 20 non-null fields, one of which is <code>criticalMetric: Float!</code> backed by a fragile external service. That service times out. What does the client receive, and how would you change the schema so the other 19 fields still render?',
    hint: 'Trace the bubble from criticalMetric upward. Then ask which single ! is causing the whole response to vanish.',
    solution: `The criticalMetric resolver throws -> field error on a non-null field -> bubbles to dashboard (also non-null) -> bubbles to the root -> data is null. The client gets { data: null, errors: [...] } and renders nothing, even though 19 of 20 fields resolved fine.

The fix is to make criticalMetric nullable: criticalMetric: Float (drop the !). Now its failure is absorbed at that one field -- criticalMetric comes back null with an entry in errors, and the other 19 fields render normally. Reserve ! for values that genuinely cannot fail; a field backed by a fragile dependency is exactly the case where a nullable type keeps the rest of the response alive.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If a non-null field errors, only that field is null in the response and everything around it is fine."',
      reality: 'Only if the parent is nullable. A non-null field error propagates to its parent; if the parent is also non-null it keeps climbing, nulling each non-null ancestor in turn, until it reaches a nullable field or the root. One failed leaf can erase a whole branch.',
    },
    {
      thought: '"Adding <code>!</code> everywhere makes the API stricter and therefore safer."',
      reality: 'It makes the API more brittle. Every <code>!</code> is a promise the field can always resolve. On a field that can genuinely fail, that promise turns a small recoverable null into a cascading null that takes its parent — and possibly the entire response — down with it.',
    },
    {
      thought: '"When the visible null bubbles up, the client loses track of what actually went wrong."',
      reality: 'The original field error stays in the <code>errors</code> array with its full <code>path</code> (e.g. <code>["user","account","displayName"]</code>). The client can see exactly which leaf failed even though the null it renders sits several levels higher.',
    },
  ];

  topicLabel = 'GraphQL Fundamentals';
  topicRoute = '/graphql/fundamentals';
  prev: SubtopicLink | null = {
    label: 'The Post Type Never Declared Its Own author Field',
    route: '/graphql/fundamentals/post-type-missing-author-field',
  };
  next: SubtopicLink | null = {
    label: 'Aliases Resolve Field-Name Collisions',
    route: '/graphql/fundamentals/aliases-resolve-field-collisions',
  };
}
