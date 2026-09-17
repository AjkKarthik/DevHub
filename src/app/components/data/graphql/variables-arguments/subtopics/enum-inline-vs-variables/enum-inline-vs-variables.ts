import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-enum-inline-vs-variables',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './enum-inline-vs-variables.html',
  styleUrl: './enum-inline-vs-variables.scss',
})
export class EnumInlineVsVariablesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two places, two forms',
      points: [
        'The main page notes it in a mistake entry and a quiz question: an enum value is a <strong>bare identifier</strong> when written inline in the query (<code>status: PUBLISHED</code>), but a <strong>JSON string</strong> when supplied through the variables object (<code>{ "status": "PUBLISHED" }</code>).',
        'This is not an inconsistency — it is the two syntaxes each type of input uses. The query document is GraphQL, which has a distinct <code>EnumValue</code> token. The variables object is JSON, which has no enum type, so every enum arrives as a string and the server coerces it against the enum’s value names.',
        'Get it backwards and you get a validation error, not a silent coercion. Writing <code>status: "PUBLISHED"</code> inline puts a <code>StringValue</code> where the schema expects an enum — rejected at validation. Writing <code>{ "status": PUBLISHED }</code> in the variables object is not even valid JSON.',
        'Enum value names are case-sensitive. <code>"published"</code> in the variables JSON does not coerce to <code>PUBLISHED</code> — it fails as "value does not exist in the enum".',
      ],
    },
    {
      heading: 'Why hand-built query strings trip on this',
      points: [
        'Code that assembles a query string by concatenation naturally reaches for <code>status: "${value}"</code> — quoting the interpolated value the way you would any string. For an enum argument that is wrong: the quotes make it a string literal.',
        'Getting it "right" by interpolating the bare identifier (<code>status: ${value}</code>, no quotes) technically parses, but now you are string-templating untrusted input into a query document — the exact injection risk variables exist to remove.',
        'The clean answer is a variable: <code>status: $status</code> in the document, <code>{ "status": value }</code> in the variables object, where the enum-as-string is correct <em>and</em> the value never touches the query text.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Coercion, two paths',
      language: 'typescript',
      code: `const ENUM_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

// Inline in the query document: the value is an AST node.
function coerceEnumInline(ast: { kind: string; value: string }) {
  if (ast.kind === 'StringValue')
    return { ok: false, error: 'Enum "PostStatus" cannot represent a string value: "' + ast.value + '"' };
  if (ast.kind !== 'EnumValue')
    return { ok: false, error: 'Enum "PostStatus" cannot represent non-enum literal (' + ast.kind + ')' };
  if (!ENUM_VALUES.includes(ast.value))
    return { ok: false, error: 'Value "' + ast.value + '" does not exist in "PostStatus" enum' };
  return { ok: true, value: ast.value };
}

// Through the variables JSON: the value arrives as a plain string.
function coerceEnumFromVariables(raw: unknown) {
  if (typeof raw !== 'string')
    return { ok: false, error: 'Enum "PostStatus" cannot represent non-string value: ' + JSON.stringify(raw) };
  if (!ENUM_VALUES.includes(raw)) // case-sensitive
    return { ok: false, error: 'Value "' + raw + '" does not exist in "PostStatus" enum' };
  return { ok: true, value: raw };
}`,
    },
    {
      label: 'Right and wrong, both paths',
      language: 'typescript',
      code: `// INLINE -- bare identifier is correct
console.log(coerceEnumInline({ kind: 'EnumValue', value: 'PUBLISHED' }));
// { ok: true, value: 'PUBLISHED' }

// INLINE -- quoted string is a validation error
console.log(coerceEnumInline({ kind: 'StringValue', value: 'PUBLISHED' }));
// { ok: false, error: 'Enum "PostStatus" cannot represent a string value: "PUBLISHED"' }

// VARIABLES -- string is correct
console.log(coerceEnumFromVariables('PUBLISHED'));
// { ok: true, value: 'PUBLISHED' }

// VARIABLES -- wrong case does not coerce
console.log(coerceEnumFromVariables('published'));
// { ok: false, error: 'Value "published" does not exist in "PostStatus" enum' }

// VARIABLES -- a number is rejected
console.log(coerceEnumFromVariables(2));
// { ok: false, error: 'Enum "PostStatus" cannot represent non-string value: 2' }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A form has a status <code>&lt;select&gt;</code>; your code builds the query by hand and drops the selected value in as <code>status: "DRAFT"</code>. Every submission fails validation. Why, and what is the fix that does not involve string-templating an unquoted identifier into the query?',
    hint: 'What kind of literal is "DRAFT" (with the quotes) in a GraphQL document?',
    solution: `Inside the query document, "DRAFT" with quotes is a StringValue literal. The schema expects PostStatus, an enum, and an enum position rejects a string literal at validation -- "Enum PostStatus cannot represent a string value: DRAFT". The query never runs.

The fix is a variable. Put status: $status in the document and send { "status": "DRAFT" } in the variables object. Through the variables JSON the enum IS a string, so "DRAFT" is exactly right there, and the value never becomes part of the query text -- no string templating, no injection surface. Interpolating the bare identifier (status: DRAFT, no quotes) would parse, but it puts untrusted input into the document, which is the thing variables exist to avoid.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"An enum value should be quoted everywhere, like any other string."',
      reality: 'Inline in the query it is a bare identifier (<code>status: PUBLISHED</code>). Quoting it inline makes it a string literal, which a schema enum position rejects at validation. Only in the variables JSON is it a string.',
    },
    {
      thought: '"If I send the enum in slightly the wrong case through variables, the server will normalise it."',
      reality: 'Enum value names are case-sensitive. <code>"published"</code> does not become <code>PUBLISHED</code> — it fails as "value does not exist in the enum".',
    },
    {
      thought: '"Interpolating the enum identifier into the query string, unquoted, is a fine workaround."',
      reality: 'It parses, but it puts an untrusted value directly into the query document — the injection risk variables are designed to eliminate. Use <code>status: $status</code> with the value in the variables object instead.',
    },
  ];

  topicLabel = 'Variables & Arguments';
  topicRoute = '/graphql/variables-arguments';
  prev: SubtopicLink | null = {
    label: 'When a Variable Can Be Used Where a Different Type Is Expected',
    route: '/graphql/variables-arguments/variable-usage-type-compatibility',
  };
  next: SubtopicLink | null = {
    label: 'GET vs POST, and Why GET Is Query-Only',
    route: '/graphql/variables-arguments/graphql-get-vs-post',
  };
}
