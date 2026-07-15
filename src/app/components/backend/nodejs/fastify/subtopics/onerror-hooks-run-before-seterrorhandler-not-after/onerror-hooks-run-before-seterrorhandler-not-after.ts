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
  templateUrl: './onerror-hooks-run-before-seterrorhandler-not-after.html',
  styleUrl: './onerror-hooks-run-before-seterrorhandler-not-after.scss'
})
export class OnerrorHooksRunBeforeSeterrorhandlerNotAfterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions onError hooks for "centralised error transformation" and separately shows setErrorHandler() in its own challenge solution — worth knowing precisely how these two mechanisms relate when BOTH are registered',
      points: [
        'These are not alternative, mutually-exclusive ways to handle the same error — both genuinely fire for the same thrown/rejected error if both are registered. Fastify\'s own current documentation states this directly: the onError hook "will be executed before the Custom Error Handler set by setErrorHandler." The hook runs FIRST, observing the raw error before any custom handler has had a chance to transform or respond to it.',
        'This ordering matters specifically because onError hooks are meant for side effects — logging, metrics, alerting — that should happen regardless of how the error ultimately gets formatted into a response, while setErrorHandler is meant to actually PRODUCE that response. Running the hook first means logging/metrics genuinely capture the original error, unaffected by whatever setErrorHandler later does to shape the client-facing response.',
      ]
    },
    {
      heading: 'A documentation-history caveat worth being aware of, given how easy this specific fact is to get backwards',
      points: [
        'This exact ordering was previously stated the OPPOSITE way in some earlier documentation revisions (implying onError only ran AFTER, and only conditionally on what the custom handler did) — a real, confirmed documentation inconsistency that was flagged and tracked as a Fastify GitHub issue. If you learned this from an older tutorial, blog post, or cached documentation, double-check against the CURRENT official docs rather than assuming the fact you remember is still accurate.',
        'The practical, current, correct mental model: onError is a pure observer that runs first and cannot prevent or replace the eventual response — setErrorHandler runs second and is what actually determines what gets sent back to the client. Neither one "wins" over the other in the sense of preventing the other from running; they compose, in that specific order.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Both fire for the same error, in a specific order',
      language: 'typescript',
      code: `const app = Fastify();

// This runs FIRST for any error, before setErrorHandler below —
// pure observation, cannot change what response gets sent.
app.addHook('onError', async (request, reply, error) => {
  metrics.increment('errors.total', { type: error.name });
  logger.error({ err: error, url: request.url }, 'Request failed');
  // No response logic here — this hook's job is side effects only.
});

// This runs SECOND — it's what actually shapes the client response.
app.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    return reply.status(400).send({ error: 'Validation failed', details: error.validation });
  }
  reply.status(error.statusCode ?? 500).send({ error: error.message });
});

app.get('/risky', async () => {
  throw new Error('Something broke');
  // Execution order for this thrown error:
  // 1. onError hook runs — logs and records the metric
  // 2. setErrorHandler runs — sends the actual { error: "..." } response
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team registers both an onError hook (which logs every error to a monitoring service) and a setErrorHandler (which formats a client-facing error response, sometimes rewriting the error message to something more user-friendly before sending it). A developer worries: "if setErrorHandler rewrites the error message before sending the response, will our monitoring logs from the onError hook show the ORIGINAL error message, or the rewritten, user-friendly one?" Answer their question precisely, using the documented execution order between these two mechanisms.',
    hint: 'Does onError run before or after setErrorHandler? If it runs first, has setErrorHandler had any chance to modify anything yet by the time onError observes the error?',
    solution: 'The monitoring logs will show the ORIGINAL error message, not the rewritten one — because onError runs BEFORE setErrorHandler, per Fastify\'s current official documentation. By the time the onError hook executes and logs the error, setErrorHandler has not run yet at all, so there is nothing for it to have rewritten — the hook is observing the raw, original error object exactly as it was thrown, completely unaffected by whatever transformation setErrorHandler will later apply when it runs second and actually shapes the response sent to the client. This ordering is specifically what makes onError hooks reliable for logging/monitoring purposes — since they run first and are unaffected by the error-response-shaping logic that runs afterward, they always capture the true, original error, regardless of how user-friendly or different the eventual client-facing response ends up looking.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'onError hooks and setErrorHandler are two alternative ways to handle errors in Fastify — registering one means the other effectively becomes unused, similar to choosing between two competing options.',
      reality: 'This subtopic\'s theory clarifies both genuinely fire for the same error if both are registered — they are not mutually exclusive alternatives, they compose in a specific, documented order (onError first, then setErrorHandler).'
    },
    {
      thought: 'Since setErrorHandler runs as part of handling an error, an onError hook registered alongside it will observe whatever transformed version of the error setErrorHandler produces.',
      reality: 'This subtopic\'s exercise shows the opposite is true — onError runs BEFORE setErrorHandler, so it always observes the original, untransformed error, regardless of anything setErrorHandler does afterward.'
    },
    {
      thought: 'The execution order between onError and setErrorHandler is a stable, unambiguous fact that has never been documented differently.',
      reality: 'This subtopic\'s theory notes this exact ordering was genuinely stated the opposite way in some earlier Fastify documentation revisions — a real, tracked documentation inconsistency — making it worth double-checking against current official docs rather than trusting an older source or memory alone.'
    }
  ];
}
