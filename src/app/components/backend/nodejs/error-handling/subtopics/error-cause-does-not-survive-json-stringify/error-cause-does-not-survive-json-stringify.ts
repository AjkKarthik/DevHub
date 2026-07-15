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
  templateUrl: './error-cause-does-not-survive-json-stringify.html',
  styleUrl: './error-cause-does-not-survive-json-stringify.scss'
})
export class ErrorCauseDoesNotSurviveJsonStringifySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA recommends new Error("context message", { cause: originalError }) to preserve the original error when re-throwing — accurate advice, but it never mentions that cause, message, AND stack all silently disappear the moment you JSON.stringify() an error, which matters enormously for structured logging',
      points: [
        'Inspecting the actual property descriptors confirms it directly: message, stack, and cause on a real Error instance are all defined as NON-ENUMERABLE own properties. JSON.stringify() (like Object.keys() and for...in) only serializes ENUMERABLE own properties — so it simply never sees message, stack, or cause at all.',
        'The practical, easy-to-miss consequence: JSON.stringify(new Error("boom", { cause: new Error("root cause") })) produces the string "{}" — a completely empty object. Not a partial object missing a few fields — nothing. Passing a raw Error instance directly to a JSON-based logger (or any code that calls JSON.stringify() on it) silently discards the entire error, cause chain included.',
        'This is not a niche edge case — it is a common trap: structured-logging setups (Pino, or any custom logger that formats output as JSON for log aggregation) that call JSON.stringify(err) directly, rather than extracting fields first, produce empty or near-empty log entries for exactly the errors that most need investigating.',
      ]
    },
    {
      heading: 'The standard workaround, and why cause chains need it too',
      points: [
        'The fix used by structured-logging libraries is to manually extract the fields you need into a plain object BEFORE serializing: { message: err.message, stack: err.stack, cause: err.cause, name: err.name } — plain object properties created this way ARE enumerable by default, so JSON.stringify() on that extracted object works correctly.',
        'A cause chain compounds the problem: err.cause is itself typically another Error instance, which has the exact same non-enumerable-properties issue. A naive extraction like { message: err.message, cause: err.cause } still produces an unreadable cause: {} in the final JSON unless the extraction is applied RECURSIVELY down the whole cause chain, or the logger has explicit Error-aware serialization support built in.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent failure',
      language: 'typescript',
      code: `const rootCause = new Error('Connection refused');
const wrapped = new Error('Failed to fetch user data', { cause: rootCause });

console.log(JSON.stringify(wrapped));
// "{}"  — an empty object. message, stack, AND cause are all gone.

// This is exactly what happens if a JSON-based logger does this:
logger.error(JSON.stringify(wrapped));
// The resulting log entry for a REAL, cause-chained failure is
// completely uninformative — just "{}" — even though the error
// object itself has plenty of useful information on it.`,
    },
    {
      label: 'Correct extraction — including the cause chain',
      language: 'typescript',
      code: `function serializeError(err) {
  if (!(err instanceof Error)) return err;
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    // Recurse: err.cause is often ANOTHER Error with the same
    // non-enumerable-property problem — extract it too, not just
    // pass it through as-is.
    cause: err.cause ? serializeError(err.cause) : undefined,
  };
}

const rootCause = new Error('Connection refused');
const wrapped = new Error('Failed to fetch user data', { cause: rootCause });

console.log(JSON.stringify(serializeError(wrapped)));
// {"name":"Error","message":"Failed to fetch user data","stack":"...",
//  "cause":{"name":"Error","message":"Connection refused","stack":"..."}}
// The full chain is now actually visible in the log output.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s error-handling middleware does logger.error({ err }) where their logging library internally calls JSON.stringify() on whatever is passed. They notice that for errors created with new Error(msg, { cause: dbError }), their log aggregation dashboard shows entries with an empty err field, while errors WITHOUT a cause chain at least show up (their logger has some built-in Error handling for the top-level message). What\'s actually happening, and does adding a cause make an error MORE or LESS informative in their logs as currently configured?',
    hint: 'Are message, stack, and cause enumerable properties on an Error instance? Does JSON.stringify() serialize non-enumerable properties by default?',
    solution: 'Every Error instance — regardless of whether it has a cause or not — has non-enumerable message, stack, and cause properties, so JSON.stringify() on a raw Error always produces "{}" by itself. The fact that errors WITHOUT a cause chain "at least show up" suggests their logging library has some special-cased handling for the TOP-LEVEL error object (many loggers do check err instanceof Error and manually extract message/stack before serializing) — but that special-casing likely doesn\'t recurse into err.cause, which is itself just another plain value being handed to the same JSON.stringify() call. So paradoxically, in this specific setup, adding a cause makes the SAME underlying serialization gap more visible, not less — the top-level error gets special-cased and shows up fine, but its cause chain, which is exactly the debugging context the team added the cause for in the first place, gets silently dropped by the same non-enumerable-properties issue one level down. The fix is ensuring their error serialization logic recurses into err.cause explicitly, converting it to a plain object with its own message/stack/cause before the whole thing reaches JSON.stringify() — not just handling the outermost error.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'JSON.stringify(someError) produces a JSON object containing at least the error\'s message, since message is clearly a real, accessible property on every Error instance.',
      reality: 'This subtopic\'s theory and code example both show the opposite — JSON.stringify() on a raw Error instance produces an empty object "{}", because message (like stack and cause) is a non-enumerable property, and JSON.stringify() only serializes enumerable own properties.'
    },
    {
      thought: 'Since the main page recommends new Error(msg, { cause: originalError }) for preserving error context, a cause chain automatically appears in a structured JSON log entry once that error is logged.',
      reality: 'This subtopic\'s theory clarifies the opposite — cause is just as non-enumerable as message and stack, so a raw error (cause included) passed to JSON.stringify() loses the entire chain unless explicitly, and recursively, extracted into a plain object first.'
    },
    {
      thought: 'Manually extracting { message: err.message, cause: err.cause } into a plain object before JSON.stringify() is sufficient to preserve a full error\'s debugging context, including any nested cause.',
      reality: 'This subtopic\'s second code example and exercise both show a single-level extraction is not enough — err.cause is typically ANOTHER Error instance with the same non-enumerable-property issue, so the extraction needs to recurse down the whole cause chain, not just the outermost error.'
    }
  ];
}
