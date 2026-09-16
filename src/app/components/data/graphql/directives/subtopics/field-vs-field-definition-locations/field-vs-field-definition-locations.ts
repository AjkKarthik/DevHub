import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-field-vs-field-definition-locations',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './field-vs-field-definition-locations.html',
  styleUrl: './field-vs-field-definition-locations.scss',
})
export class FieldVsFieldDefinitionLocationsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two disjoint sets of locations',
      points: [
        'A quiz question notes that <code>FIELD</code> and <code>FIELD_DEFINITION</code> are different. They belong to two entirely separate namespaces that share no members.',
        '<strong>Executable</strong> directive locations are where a directive may appear in a query/operation <em>document</em>: <code>QUERY</code>, <code>MUTATION</code>, <code>SUBSCRIPTION</code>, <code>FIELD</code>, <code>FRAGMENT_DEFINITION</code>, <code>FRAGMENT_SPREAD</code>, <code>INLINE_FRAGMENT</code>, <code>VARIABLE_DEFINITION</code>.',
        '<strong>Type-system</strong> directive locations are where a directive may appear in the <em>SDL</em>: <code>SCHEMA</code>, <code>SCALAR</code>, <code>OBJECT</code>, <code>FIELD_DEFINITION</code>, <code>ARGUMENT_DEFINITION</code>, <code>INTERFACE</code>, <code>UNION</code>, <code>ENUM</code>, <code>ENUM_VALUE</code>, <code>INPUT_OBJECT</code>, <code>INPUT_FIELD_DEFINITION</code>.',
        '<code>FIELD</code> means "a field selected in a query" — <code>name @lowercase</code> inside <code>{ user { name } }</code>. <code>FIELD_DEFINITION</code> means "a field declared on a type" — <code>name: String @lowercase</code> in <code>type User</code>. A directive declared for one cannot be used in the other.',
      ],
    },
    {
      heading: 'Which one you pick changes the whole mechanism',
      points: [
        'A directive declared <code>on FIELD_DEFINITION</code> is applied by the <strong>schema author</strong> in the SDL and implemented with a schema transformer that wraps resolvers at build time. Clients cannot add or remove it.',
        'A directive declared <code>on FIELD</code> is written by the <strong>client</strong> in each query and implemented differently — the server inspects <code>info</code> (or a custom visitor over the operation AST) during execution to see whether the directive is present on the current selection. <code>@skip</code> and <code>@include</code> are the built-in examples of this shape.',
        'So the choice is not cosmetic: <code>FIELD_DEFINITION</code> gives you a fixed, schema-controlled behaviour; <code>FIELD</code> gives clients a per-query switch. They need different implementations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The location check',
      language: 'typescript',
      code: `const EXECUTABLE = new Set([
  'QUERY', 'MUTATION', 'SUBSCRIPTION', 'FIELD', 'FRAGMENT_DEFINITION',
  'FRAGMENT_SPREAD', 'INLINE_FRAGMENT', 'VARIABLE_DEFINITION',
]);
const TYPE_SYSTEM = new Set([
  'SCHEMA', 'SCALAR', 'OBJECT', 'FIELD_DEFINITION', 'ARGUMENT_DEFINITION',
  'INTERFACE', 'UNION', 'ENUM', 'ENUM_VALUE', 'INPUT_OBJECT', 'INPUT_FIELD_DEFINITION',
]);

// context: 'query-field'  = a field selected in a query document
//          'schema-field'  = a field declared on a type in SDL
function canUseDirective(declaredLocations: string[], context: 'query-field' | 'schema-field') {
  const need = context === 'query-field' ? 'FIELD' : 'FIELD_DEFINITION';
  return declaredLocations.includes(need)
    ? { ok: true, why: 'declared on ' + need }
    : { ok: false, why: 'Directive may not be used on ' + need +
        ' (it is declared on ' + declaredLocations.join(', ') + ')' };
}

// The two sets never overlap:
console.log([...EXECUTABLE].filter((x) => TYPE_SYSTEM.has(x))); // []`,
    },
    {
      label: 'Used in the wrong place',
      language: 'typescript',
      code: `// @auth is a schema directive: declared on FIELD_DEFINITION
const authLocations = ['FIELD_DEFINITION', 'OBJECT'];

console.log(canUseDirective(authLocations, 'schema-field'));
// { ok: true, why: 'declared on FIELD_DEFINITION' }

console.log(canUseDirective(authLocations, 'query-field'));
// { ok: false, why: 'Directive may not be used on FIELD
//   (it is declared on FIELD_DEFINITION, OBJECT)' }

// @skip is an executable directive: declared on FIELD (+ the fragment locations)
const skipLocations = ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'];

console.log(canUseDirective(skipLocations, 'query-field'));
// { ok: true, why: 'declared on FIELD' }

console.log(canUseDirective(skipLocations, 'schema-field'));
// { ok: false, why: 'Directive may not be used on FIELD_DEFINITION
//   (it is declared on FIELD, FRAGMENT_SPREAD, INLINE_FRAGMENT)' }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You built an <code>@uppercase</code> directive, declared it <code>on FIELD_DEFINITION</code>, and wrote a schema transformer for it. Then you try <code>query { user { name @uppercase } }</code> and get <code>Directive "@uppercase" may not be used on FIELD.</code> Why, and what is the fix — for each of the two things you might actually want?',
    hint: 'FIELD (in a query) and FIELD_DEFINITION (in the SDL) are different location namespaces.',
    solution: `@uppercase is declared on FIELD_DEFINITION, which is a type-system (SDL) location. FIELD -- a field selected in a query document -- is an executable location, and the two sets are disjoint. A directive declared only for FIELD_DEFINITION cannot appear in a query at all, hence the validation error.

Two fixes, depending on intent:

1. If the SCHEMA should decide which fields are uppercased: keep it on FIELD_DEFINITION and apply it in the SDL -- name: String @uppercase -- not in the query. Your existing schema transformer already handles this; just move the annotation.

2. If the CLIENT should decide per query: redeclare it directive @uppercase on FIELD and implement it as an execution-time concern. A schema transformer will not help here -- instead, in the field resolver (or a wrapping resolver), read info.fieldNodes[0].directives to check whether @uppercase is present on this selection, and transform the return value if so. That is the same shape as @skip / @include.

You cannot get both mechanisms from one declaration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"<code>FIELD</code> and <code>FIELD_DEFINITION</code> are two names for roughly the same thing."',
      reality: 'They are members of two disjoint location namespaces. <code>FIELD</code> is executable (a field selected in a query document); <code>FIELD_DEFINITION</code> is type-system (a field declared on a type in SDL). A directive declared for one is a validation error in the other.',
    },
    {
      thought: '"A schema transformer can also handle a directive that clients write in their queries."',
      reality: 'No. Schema transformers wrap resolvers at build time based on SDL annotations. A directive on a query <code>FIELD</code> is inspected at execution time via <code>info</code> (or an operation-AST visitor) — a different implementation entirely.',
    },
    {
      thought: '"I can declare a directive on both <code>FIELD</code> and <code>FIELD_DEFINITION</code> and one implementation will cover both."',
      reality: 'The declaration can list both locations, but each usage still needs its own handling — the SDL annotation via a schema transformer, and the query usage via execution-time inspection. One code path does not serve both.',
    },
  ];

  topicLabel = 'Directives';
  topicRoute = '/graphql/directives';
  prev: SubtopicLink | null = {
    label: 'Declaring a Directive Does Nothing — the Transformer Is the Behavior',
    route: '/graphql/directives/directive-declaration-vs-transformer',
  };
  next: SubtopicLink | null = null;
}
