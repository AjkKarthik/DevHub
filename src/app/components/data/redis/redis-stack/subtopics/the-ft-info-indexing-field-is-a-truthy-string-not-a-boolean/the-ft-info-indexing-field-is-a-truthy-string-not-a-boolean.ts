import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-ft-info-indexing-field-is-a-truthy-string-not-a-boolean',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-ft-info-indexing-field-is-a-truthy-string-not-a-boolean.html',
  styleUrl: './the-ft-info-indexing-field-is-a-truthy-string-not-a-boolean.scss',
})
export class TheFtInfoIndexingFieldIsATruthyStringNotABooleanSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the check, never shows it working',
      points: [
        'The main page\'s own first mistake block says the real risk is "querying before indexing is complete on large datasets" and points to <code>FT.INFO idx:products</code> as the way to check — but no codeTab anywhere on the page actually polls it.',
        'Verified directly against Redis\'s own official <code>FT.INFO</code> reference: the reply includes an <code>indexing</code> field ("Indicates whether the index is currently being generated") and a <code>percent_indexed</code> field, with the documented example reply showing <code>indexing</code> as the literal two-character value <code>"0"</code> when done.',
      ],
    },
    {
      heading: 'The trap: "0" is a non-empty string, and non-empty strings are truthy',
      points: [
        'A naive readiness check like <code>while (!info.indexing)</code> — intending "keep waiting while indexing is NOT done" — is backwards the moment <code>indexing</code> comes back as the raw string <code>"0"</code>: <code>!"0"</code> evaluates to <code>false</code> in JavaScript, since ANY non-empty string, including <code>"0"</code>, is truthy.',
        'The safe fix is a numeric comparison — <code>Number(info.indexing) === 0</code> — which correctly evaluates to <code>true</code> regardless of whether the field comes back as the string <code>"0"</code>, the number <code>0</code>, or (on a client that parses it) the boolean <code>false</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gotcha, reproduced and fixed',
      language: 'typescript',
      code: `function isIndexingComplete(ftInfoReply: { indexing: unknown }): boolean {
  // BUGGY: relies on the raw truthiness of the field.
  return !ftInfoReply.indexing;
}

function isIndexingCompleteFixed(ftInfoReply: { indexing: unknown }): boolean {
  // FIXED: numeric comparison, safe regardless of string/number/boolean shape.
  return Number(ftInfoReply.indexing) === 0;
}

// FT.INFO's own documented example reply shape: indexing comes back as the STRING "0".
const doneReply = { indexing: '0', percent_indexed: '1' };
const inProgressReply = { indexing: '1', percent_indexed: '0.42' };

console.log(isIndexingComplete(doneReply));
// false -- WRONG, indexing is actually done, but "0" is a non-empty (truthy) string

console.log(isIndexingComplete(inProgressReply));
// false -- happens to be "correct" here by coincidence, which is exactly what
// makes this bug easy to miss in casual testing

console.log(isIndexingCompleteFixed(doneReply));
// true -- correct

console.log(isIndexingCompleteFixed(inProgressReply));
// false -- correct

async function waitForIndexReady(client: any, indexName: string, pollMs = 100) {
  let info = await client.ft.info(indexName);
  while (Number(info.indexing) !== 0) {
    await new Promise((r) => setTimeout(r, pollMs));
    info = await client.ft.info(indexName);
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A different naive check writes <code>while (info.indexing !== "0")</code> instead of using raw truthiness. Does THIS version have the same bug as <code>while (!info.indexing)</code>? Trace both against the exact documented reply values.',
    hint: 'This version does a direct string equality check rather than relying on truthiness — does the concern about truthy non-empty strings even apply here?',
    solution: `No, this version does not have the same bug -- a direct string-equality comparison against the literal "0" is not affected by JavaScript's truthy/falsy coercion rules at all. Tracing it: for doneReply.indexing === "0", the comparison 'info.indexing !== "0"' correctly evaluates to false, so the loop correctly does NOT keep waiting. For inProgressReply.indexing === "1", the comparison correctly evaluates to true, so the loop correctly keeps waiting.

This version is genuinely safe as long as the client library reliably returns the field as a STRING matching FT.INFO's own documented reply shape. The Number()-based fix from the codeTab above is slightly more defensive still, since it also tolerates a client that happens to parse the field into an actual number or boolean instead of leaving it as a raw string -- but a direct string-equality check against the documented "0" literal is a perfectly correct fix for the SPECIFIC bug this subtopic covers.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If a field from a database reply looks like a boolean flag (0 or 1), it is safe to use it directly in a JavaScript truthiness check."',
      reality: 'Verified above: whether this is safe depends entirely on whether the field arrives as an actual number/boolean or as a STRING containing "0"/"1" — the latter is always truthy in JavaScript regardless of its numeric-looking content, which is exactly the trap this subtopic demonstrates with FT.INFO\'s own documented reply.',
    },
    {
      thought: '"This bug would be obvious immediately during testing, since the readiness check would clearly never work."',
      reality: 'Verified above: the buggy <code>isIndexingComplete</code> happens to return the "correct-looking" <code>false</code> for an in-progress reply too, purely by coincidence — a developer testing only the in-progress case (which is the natural first thing to test) would see it behave as expected and never notice the check is broken for the DONE case, until a real production query runs against a supposedly-ready index that the buggy check never actually confirmed.',
    },
  ];

  topicLabel = 'Redis Stack';
  topicRoute = '/redis/redis-stack';
  prev: SubtopicLink | null = {
    label: 'When Modules Are Built In (Redis 8.0+) vs. Still Need Stack',
    route: '/redis/redis-stack/when-modules-are-built-in-redis-8-vs-still-need-stack',
  };
  next: SubtopicLink | null = {
    label: 'Co-Locating a Search Index on One Cluster Node with Hash Tags',
    route: '/redis/redis-stack/co-locating-a-search-index-on-one-cluster-node-with-hash-tags',
  };
}
