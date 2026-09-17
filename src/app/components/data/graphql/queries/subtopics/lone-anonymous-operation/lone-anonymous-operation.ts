import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lone-anonymous-operation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lone-anonymous-operation.html',
  styleUrl: './lone-anonymous-operation.scss',
})
export class LoneAnonymousOperationSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The two rules that decide which operation runs',
      points: [
        'The main page says "name your operations" and "specify operationName when a document has multiple operations", but never shows the exact rules or the errors. There are two.',
        '<strong>Lone Anonymous Operation</strong> (a validation rule): a document may contain an unnamed operation (<code>{ user { name } }</code>) <em>only</em> if it is the single operation in the document. An anonymous operation alongside any other operation — named or anonymous — is a hard validation error, rejected before execution.',
        '<strong>Operation selection</strong> (a request-time check): if a valid document has more than one operation, the request must carry an <code>operationName</code> naming which one to run. Omit it and the server responds "Must provide operation name if query contains multiple operations."',
        'A document with exactly one operation always runs that one, named or not, with no <code>operationName</code> needed.',
      ],
    },
    {
      heading: 'Why "always name your operations" is a real rule',
      points: [
        'The common advice frames naming as a debugging nicety — names show up in server logs, traces, and Apollo Studio. That is true, but it is also what keeps a document composable.',
        'Client tooling frequently concatenates many query files into one document per request, or merges fragments and operations at build time. The moment two anonymous operations end up in the same document, Lone Anonymous Operation fails the whole request — including the operation you actually wanted.',
        'Named operations sidestep both problems: any number can coexist in one document, and the client picks one per request with <code>operationName</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Operation selection, modelled',
      language: 'typescript',
      code: `type Operation = { name: string | null };

function pickOperation(ops: Operation[], operationName?: string): string {
  // Lone Anonymous Operation validation rule
  const anon = ops.filter(o => o.name == null);
  if (anon.length > 0 && ops.length > 1)
    return 'VALIDATION ERROR: This anonymous operation must be the only defined operation.';

  // exactly one operation -> run it, no operationName needed
  if (ops.length === 1) return 'run: ' + (ops[0].name ?? '(anonymous)');

  // multiple named operations -> operationName is required
  if (!operationName)
    return 'ERROR: Must provide operation name if query contains multiple operations.';
  const match = ops.find(o => o.name === operationName);
  return match
    ? 'run: ' + operationName
    : 'ERROR: Unknown operation named "' + operationName + '".';
}`,
    },
    {
      label: 'Every case',
      language: 'typescript',
      code: `// one anonymous op
console.log(pickOperation([{ name: null }]));
// run: (anonymous)

// one named op -- no operationName needed
console.log(pickOperation([{ name: 'GetUser' }]));
// run: GetUser

// two named ops, no operationName
console.log(pickOperation([{ name: 'GetUser' }, { name: 'GetPosts' }]));
// ERROR: Must provide operation name if query contains multiple operations.

// two named ops, operationName given
console.log(pickOperation([{ name: 'GetUser' }, { name: 'GetPosts' }], 'GetPosts'));
// run: GetPosts

// one anonymous + one named -> Lone Anonymous Operation fails the whole document
console.log(pickOperation([{ name: null }, { name: 'GetPosts' }]));
// VALIDATION ERROR: This anonymous operation must be the only defined operation.

// two anonymous ops -> same failure
console.log(pickOperation([{ name: null }, { name: null }]));
// VALIDATION ERROR: This anonymous operation must be the only defined operation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A build step bundles every <code>*.graphql</code> file in a feature folder into one document string for a single request. Two of those files contain anonymous <code>{ ... }</code> queries. Every request from that feature now fails before any resolver runs. Why, and what is the fix?',
    hint: 'What does the Lone Anonymous Operation rule allow in a document with more than one operation?',
    solution: `The bundled document now contains two anonymous operations. The Lone Anonymous Operation validation rule says an unnamed operation is only allowed when it is the ONLY operation in the document. Two anonymous operations (or one anonymous plus one named) makes the whole document invalid, so validation rejects every request built from that bundle -- not just the extra operation, the entire request.

The fix is to give every operation a name (query GetSidebar { ... }, query GetFeed { ... }, and so on) and have the client send operationName with each request to select one. Named operations can coexist in any number in a single document; anonymous ones cannot share a document with anything. This is why "always name your operations" is a correctness rule for any setup that merges query files, not just a logging convenience.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Naming operations is purely for nicer server logs and traces."',
      reality: 'It is also a composability requirement. An anonymous operation is only valid as the sole operation in a document, so any tool that merges query files breaks the moment two anonymous operations meet. Named operations can coexist freely.',
    },
    {
      thought: '"If I forget <code>operationName</code> on a multi-operation document, the server just runs the first one."',
      reality: 'It returns an error: "Must provide operation name if query contains multiple operations." There is no implicit "first operation wins" — you must name which one to execute.',
    },
    {
      thought: '"A single named operation still needs <code>operationName</code> in the request."',
      reality: 'No. A document with exactly one operation runs that operation whether it is named or anonymous, with or without <code>operationName</code>. The requirement only kicks in once there are two or more.',
    },
  ];

  topicLabel = 'GraphQL Queries';
  topicRoute = '/graphql/queries';
  prev: SubtopicLink | null = {
    label: 'Field Merging: Two Selections of the Same Field Must Be Compatible',
    route: '/graphql/queries/field-merging-conflicts',
  };
  next: SubtopicLink | null = null;
}
