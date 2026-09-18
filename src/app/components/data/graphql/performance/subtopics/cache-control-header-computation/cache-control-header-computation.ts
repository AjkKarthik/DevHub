import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-performance-cache-control-header-computation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cache-control-header-computation.html',
  styleUrl: './cache-control-header-computation.scss'
})
export class CacheControlHeaderComputationSubtopic {
  topicLabel = 'Performance & Security';
  topicRoute = '/graphql/performance';

  theory: TheoryPoint[] = [
    {
      heading: '@cacheControl does not exist until YOUR schema declares it',
      points: [
        'Apollo Server does not inject <code>@cacheControl</code> into every schema automatically -- it is a directive you must declare yourself in SDL, the same way the main page\'s own codeTab shows.',
        'Verified directly against Apollo Server\'s own caching documentation: the real enum name is <code>CacheControlScope</code>, not <code>CacheScope</code> -- a schema declaring the directive with the wrong enum name fails at startup with a schema-validation error, since <code>CacheControlScope</code> is never actually referenced anywhere.',
        'The full, correct definition also allows the directive on <code>INTERFACE</code> and <code>UNION</code> locations, and includes a third field, <code>inheritMaxAge: Boolean</code>, which lets a child field skip setting its own maxAge and instead inherit its parent object\'s value.'
      ]
    },
    {
      heading: 'The overall response header is the MOST RESTRICTIVE of every selected field, on two independent axes',
      points: [
        'Verified directly against Apollo Server\'s own documentation: the response <code>maxAge</code> is the LOWEST maxAge among every field actually selected in the query -- one <code>maxAge: 0</code> field makes the entire response uncacheable, no matter how high the other fields\' maxAge values are.',
        'The response <code>scope</code> is set to <code>PRIVATE</code> if ANY selected field is <code>PRIVATE</code> -- a single private field silently downgrades an otherwise-all-public response, since scope and maxAge are computed independently, not averaged or combined into one score.',
        'This means a query selecting <code>title</code> (maxAge: 300, no scope stated) and <code>author</code> (maxAge: 0, scope: PRIVATE) from the main page\'s own <code>Post</code> type resolves to an overall response of maxAge 0, scope PRIVATE -- entirely uncacheable, driven by the ONE most restrictive field in the selection.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correct directive + enum definition',
      language: 'typescript',
      code: `# The fixed version -- CacheControlScope, not CacheScope, and the
# full location list including INTERFACE and UNION.
directive @cacheControl(
  maxAge: Int
  scope: CacheControlScope
  inheritMaxAge: Boolean
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

enum CacheControlScope { PUBLIC PRIVATE }

# Without this exact definition in your own schema, Apollo Server
# throws at startup: Unknown directive "@cacheControl".
# With the WRONG enum name (CacheScope, as the main page originally
# had it), the schema fails a different way: CacheScope is referenced
# by the directive but never declared as a type -- a schema build error.`
    },
    {
      label: 'Computing the effective header',
      language: 'typescript',
      code: `interface FieldCacheHint {
  maxAge: number;
  scope: 'PUBLIC' | 'PRIVATE';
}

// Reproduces Apollo Server's own documented rule: lowest maxAge wins,
// PRIVATE wins over PUBLIC, computed independently.
function computeResponseCacheControl(fields: FieldCacheHint[]): FieldCacheHint {
  if (fields.length === 0) {
    return { maxAge: 0, scope: 'PUBLIC' };
  }
  const maxAge = Math.min(...fields.map(f => f.maxAge));
  const scope = fields.some(f => f.scope === 'PRIVATE') ? 'PRIVATE' : 'PUBLIC';
  return { maxAge, scope };
}

// Query selecting { title author { name } } from the main page's own Post type:
const titleHint: FieldCacheHint = { maxAge: 300, scope: 'PUBLIC' };
const authorHint: FieldCacheHint = { maxAge: 0, scope: 'PRIVATE' };

console.log(computeResponseCacheControl([titleHint, authorHint]));
// { maxAge: 0, scope: 'PRIVATE' } -- the author field alone
// makes the WHOLE response uncacheable and private.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A query selects three fields with these cache hints: <code>{ maxAge: 300, scope: \'PUBLIC\' }</code>, <code>{ maxAge: 60, scope: \'PUBLIC\' }</code>, and <code>{ maxAge: 120, scope: \'PUBLIC\' }</code> -- no field is private. What does computeResponseCacheControl() return, and does adding a fourth field with <code>{ maxAge: 500, scope: \'PUBLIC\' }</code> change the result?',
    hint: 'The function takes the MINIMUM maxAge, not the maximum or an average -- what happens to that minimum when you add a field with a HIGHER maxAge than everything already selected?',
    solution: 'For the first three fields, computeResponseCacheControl() returns { maxAge: 60, scope: \'PUBLIC\' } -- 60 is the lowest of 300, 60, and 120, and every field is PUBLIC so the scope stays PUBLIC. Adding the fourth field (maxAge: 500, PUBLIC) does NOT change the result at all -- 500 is higher than the existing minimum of 60, so Math.min(...) still returns 60. A field with a HIGHER maxAge than everything already selected can never raise the overall response maxAge; only a field with a LOWER maxAge than the current minimum (or a PRIVATE field, on the separate scope axis) can change the computed result.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Apollo Server has built-in support for reading <code>@cacheControl</code> directives and setting response headers, the directive itself must already be part of every schema.',
      reality: 'Apollo Server\'s built-in SUPPORT for the directive (reading its arguments, computing headers) is separate from the directive\'s own SDL DEFINITION, which every schema must declare itself -- exactly like any other custom directive. Skipping the definition, or using the wrong enum name, fails at schema build time, before any query ever runs.'
    },
    {
      thought: 'The overall response maxAge and scope are computed the same way -- both take the "worst" value, so they behave identically.',
      reality: 'They ARE both "most restrictive wins," but on independent axes computed separately: maxAge takes a numeric minimum across every field\'s own value, while scope is a binary flip to PRIVATE the instant any single field is PRIVATE, regardless of what maxAge that same field declares. A field can lower the overall maxAge without affecting scope at all, or flip the scope to PRIVATE without touching maxAge at all -- fixing one axis never automatically fixes the other.'
    },
    {
      thought: 'A field with no explicit <code>@cacheControl</code> directive at all contributes nothing to the overall response header calculation.',
      reality: 'An unannotated field still participates -- Apollo Server defaults it to PUBLIC scope, and to maxAge: 0 for root fields and non-scalar fields (a scalar, non-root field instead inherits its parent field\'s maxAge, since scalar resolvers rarely fetch data of their own). Either way, an unannotated field can still be the one dragging the whole response\'s maxAge down to 0.'
    }
  ];

  next: SubtopicLink | null = { label: 'Aliased Root Fields Are Not Stopped by Disabling Batching', route: '/graphql/performance/aliased-root-fields-bypass-batching-disable' };
}
