import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-where-deprecated-can-go',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './where-deprecated-can-go.html',
  styleUrl: './where-deprecated-can-go.scss',
})
export class WhereDeprecatedCanGoSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Four locations, not two',
      points: [
        'The main page used to say <code>@deprecated</code> applies to "a field or enum value". That was the original set. The 2021 GraphQL spec release added two more, so the full list is <code>FIELD_DEFINITION</code>, <code>ENUM_VALUE</code>, <code>ARGUMENT_DEFINITION</code>, and <code>INPUT_FIELD_DEFINITION</code>.',
        'That means you can deprecate a single <strong>argument</strong> on a field, or a single <strong>field of an input object</strong> — not just whole fields and enum members.',
        'This is the clean way to rename an argument without a breaking change: add the new argument, mark the old one <code>@deprecated(reason: "renamed to ...")</code>, and let clients migrate on their own schedule while both keep working.',
        '<code>@deprecated</code> still never appears in a query document — it is a type-system directive, applied in the SDL. Trying to attach it in a query (at the <code>FIELD</code> location) is a validation error.',
      ],
    },
    {
      heading: 'You cannot deprecate a required argument',
      points: [
        'The spec forbids <code>@deprecated</code> on a <strong>required</strong> argument or input field — one whose type is non-null and has no default value.',
        'The reason is that it would be meaningless: a client is obligated to send a required argument, so "please stop using this" is not something they can act on. Deprecation only makes sense for things a client can choose to omit.',
        'To deprecate a currently-required argument you first make it optional — change its type to nullable, or give it a default value — and then apply <code>@deprecated</code>.',
        'graphql-js enforces this at schema build time: a required argument or input field carrying <code>@deprecated</code> fails schema validation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Where @deprecated is allowed',
      language: 'typescript',
      code: `const DEPRECATED_LOCATIONS = new Set([
  'FIELD_DEFINITION',
  'ARGUMENT_DEFINITION',      // added in the 2021 spec release
  'INPUT_FIELD_DEFINITION',   // added in the 2021 spec release
  'ENUM_VALUE',
]);

// target is only meaningful for ARGUMENT_DEFINITION / INPUT_FIELD_DEFINITION
function checkDeprecatedUsage(location: string, target?: { required: boolean }) {
  if (!DEPRECATED_LOCATIONS.has(location))
    return { ok: false, why: '@deprecated may not be used on ' + location };

  const isInputPosition = location === 'ARGUMENT_DEFINITION' || location === 'INPUT_FIELD_DEFINITION';
  if (isInputPosition && target?.required)
    return { ok: false, why: 'required ' + location + ' must not be deprecated -- make it optional first' };

  return { ok: true, why: '@deprecated allowed on ' + location };
}`,
    },
    {
      label: 'Every case',
      language: 'typescript',
      code: `console.log(checkDeprecatedUsage('FIELD_DEFINITION'));
// { ok: true, why: '@deprecated allowed on FIELD_DEFINITION' }

console.log(checkDeprecatedUsage('ENUM_VALUE'));
// { ok: true, why: '@deprecated allowed on ENUM_VALUE' }

console.log(checkDeprecatedUsage('ARGUMENT_DEFINITION', { required: false }));
// { ok: true, why: '@deprecated allowed on ARGUMENT_DEFINITION' }

console.log(checkDeprecatedUsage('INPUT_FIELD_DEFINITION', { required: false }));
// { ok: true, why: '@deprecated allowed on INPUT_FIELD_DEFINITION' }

console.log(checkDeprecatedUsage('ARGUMENT_DEFINITION', { required: true }));
// { ok: false, why: 'required ARGUMENT_DEFINITION must not be deprecated -- make it optional first' }

console.log(checkDeprecatedUsage('OBJECT'));
// { ok: false, why: '@deprecated may not be used on OBJECT' }

console.log(checkDeprecatedUsage('FIELD'));  // the query-document location
// { ok: false, why: '@deprecated may not be used on FIELD' }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You are renaming two things without breaking clients. First: a mutation argument <code>userId: ID</code> becomes <code>accountId: ID</code> — you add <code>accountId</code> and mark <code>userId: ID @deprecated(reason: "renamed to accountId")</code>. It builds fine. Then you try the same on a required argument, <code>token: String! @deprecated(reason: "...")</code>, and schema validation rejects it. Why, and what is the fix?',
    hint: 'Can a client stop sending a required argument on request?',
    solution: `userId: ID is nullable, so a client can choose to stop passing it. @deprecated on an optional argument is a normal, valid signal -- both arguments coexist, clients migrate to accountId when they are ready.

token: String! is required. A client MUST send it on every call, so "this is deprecated, stop using it" is not an instruction they can follow. The spec forbids @deprecated on a required (non-null, no default) argument or input field, and graphql-js fails schema validation on it.

The fix is to make token optional first, then deprecate it: token: String @deprecated(reason: "..."). Now it is nullable, clients can omit it, and the deprecation is actionable. (If the resolver genuinely still needs a token during the migration window, it can fall back to another source -- a header, the session -- when the argument is absent.)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"<code>@deprecated</code> only works on whole fields and enum values."',
      reality: 'Since the 2021 spec release it also works on <code>ARGUMENT_DEFINITION</code> and <code>INPUT_FIELD_DEFINITION</code> — you can deprecate a single argument or a single input-object field, which is how you rename them without a breaking change.',
    },
    {
      thought: '"I can put <code>@deprecated</code> on a field in my query to note it locally."',
      reality: '<code>@deprecated</code> is a type-system directive — it is applied in the SDL only. Attaching it at the <code>FIELD</code> location in a query document is a validation error.',
    },
    {
      thought: '"Any argument can be marked <code>@deprecated</code>."',
      reality: 'Only optional ones. A required (non-null, no default) argument or input field cannot carry <code>@deprecated</code> — a client cannot stop sending it, so the deprecation would be meaningless. Make it optional first.',
    },
  ];

  topicLabel = 'Directives';
  topicRoute = '/graphql/directives';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Declaring a Directive Does Nothing — the Transformer Is the Behavior',
    route: '/graphql/directives/directive-declaration-vs-transformer',
  };
}
