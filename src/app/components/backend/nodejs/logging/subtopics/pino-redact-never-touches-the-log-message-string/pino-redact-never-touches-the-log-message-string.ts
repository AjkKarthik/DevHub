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
  templateUrl: './pino-redact-never-touches-the-log-message-string.html',
  styleUrl: './pino-redact-never-touches-the-log-message-string.scss'
})
export class PinoRedactNeverTouchesTheLogMessageStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry, "Logging sensitive data," shows the fix as destructuring an object to exclude a password field before logging it — correct for THAT specific pattern, but worth knowing redact (and this fix pattern generally) protects a genuinely narrower surface than "sensitive data anywhere in a log call"',
      points: [
        'Pino\'s own documentation describes redact entirely in terms of paths to keys within the structured OBJECT argument passed to a log call — every example, every piece of path syntax, operates on object properties. Internally, Pino delegates this to the fast-redact library, whose own documented mechanism mutates values at specified object paths before the whole thing gets JSON.stringify()-ed.',
        'Nowhere in this mechanism is there any capability to scan, pattern-match, or redact content that has been interpolated directly into the log call\'s MESSAGE STRING — the human-readable text argument, as opposed to the structured metadata object. A call like logger.info(`User logged in with password ${password}`) puts the password directly into the message text itself, a completely different part of the log call than what redact paths ever examine.',
        'This means redact provides ZERO protection for this specific misuse — not because it is misconfigured (as the earlier subtopics in this batch cover), but because this category of leak is entirely outside what the feature was ever designed to address in the first place. A perfectly-configured, correctly-matching redact setup does nothing at all for a password that never appears as an object property to begin with.',
      ]
    },
    {
      heading: 'Why this is a genuinely easy mistake to make, even for a team using a "safe" structured logger correctly everywhere else',
      points: [
        'Template literals make string interpolation of sensitive data feel completely natural and low-risk — logger.info(`Processing payment for card ${cardNumber}`) reads like an ordinary, harmless debug statement, with nothing about the syntax itself suggesting a security boundary has been crossed, unlike passing the same value as an object property (logger.info({ cardNumber }, \'Processing payment\')) where the field at least has a NAME a redact path could theoretically target.',
        'The reliable discipline, following directly from this scope limitation: sensitive or potentially-sensitive values should NEVER be interpolated into a log message string, full stop — they should always be passed as named fields in the structured object argument instead, specifically so a redact path can ever have a chance of protecting them. A message string should describe WHAT happened in plain language; any actual data values belong in the object argument, where redact configuration (once correctly matched, per the earlier subtopics in this batch) can actually reach them.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A fully correct redact config — that protects nothing here',
      language: 'typescript',
      code: `import pino from 'pino';

const logger = pino({
  redact: ['password', 'cardNumber', 'token'], // correctly configured,
                                                  // correctly matching
                                                  // paths — genuinely
                                                  // no misconfiguration
                                                  // bug here at all
});

// This call interpolates the value directly into the MESSAGE STRING:
logger.info(\`Processing payment for card \${cardNumber}\`);
// Output: {"level":30,"msg":"Processing payment for card 4111111111111111", ...}
//
// The redact config is completely correct and would have worked
// perfectly if cardNumber had been passed as an OBJECT property —
// but redact has no visibility into message string CONTENT at all.
// This card number is in plain text, and no redact configuration,
// however carefully written, can ever catch this specific pattern.`,
    },
    {
      label: 'The fix: sensitive values always go in the object argument',
      language: 'typescript',
      code: `import pino from 'pino';

const logger = pino({
  redact: ['cardNumber', 'password', 'token'], // same config as before
});

// Move the sensitive value INTO the structured object argument —
// the message string now only describes WHAT happened, in plain
// language, with no actual data value embedded in it:
logger.info({ cardNumber }, 'Processing payment');
// Output: {"level":30,"cardNumber":"[Redacted]","msg":"Processing payment", ...}
//
// The SAME redact configuration now works correctly, because
// cardNumber is a named object property redact CAN see and match
// against — moving the data, not changing the redact config, is
// what fixes this.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs an automated security scan of their production logs specifically searching for leaked credit card numbers, and it flags several log lines. The team is confused, since their Pino logger has redact: ["cardNumber", "ssn", "password"] configured and a recent internal audit confirmed those exact fields are correctly redacted whenever they appear as object properties in log calls. Using the documented scope of Pino\'s redact feature, what is the most likely explanation for the leaked card numbers the scan found?',
    hint: 'Does redact operate on ANY occurrence of sensitive data anywhere in a log call, or specifically on object properties at configured paths? Is there another place in a typical log call — besides the structured object argument — where a developer might have put a card number instead?',
    solution: 'The most likely explanation is that the leaked card numbers were interpolated directly into log MESSAGE STRINGS (e.g., logger.info(`Charged card ${cardNumber} successfully`)) rather than passed as a cardNumber property in the structured object argument — a pattern redact has no visibility into whatsoever, regardless of how correctly it is configured. The team\'s internal audit was accurate as far as it went: it correctly confirmed cardNumber IS properly redacted whenever it appears as an object property, exactly as documented. But that audit almost certainly didn\'t (and couldn\'t, using redact alone) catch a different, separate coding pattern elsewhere in the codebase where a developer — perhaps in a different module, or during a quick debug-logging addition — wrote the card number directly into a template-literal message string instead of the object argument, a completely reasonable-looking thing to do that happens to sit entirely outside what redact was ever designed to protect. The fix requires two things: first, an actual codebase-wide audit (grep/static analysis) specifically searching for sensitive field names interpolated into template-literal message strings across every logger.info/warn/error call, since redact configuration review alone cannot surface this category of leak; second, adopting the discipline this subtopic describes going forward — sensitive values always go in the structured object argument, never the message string, specifically so redact has any chance of protecting them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A correctly-configured Pino redact option protects sensitive data anywhere it might appear in a log call, as long as the field name is included in the redact configuration.',
      reality: 'This subtopic\'s theory and first code example both show the opposite — redact only ever examines the structured OBJECT argument\'s properties; sensitive data interpolated directly into the message string is completely invisible to it, no matter how correctly the redact paths are configured for object properties.'
    },
    {
      thought: 'The main page\'s own "Logging sensitive data" mistake-fix (destructuring an object to exclude a password field, or using Pino\'s redact option) fully addresses the general risk of sensitive data appearing in logs.',
      reality: 'This subtopic\'s theory clarifies this fix pattern protects a genuinely narrower surface — it addresses sensitive data passed as OBJECT properties specifically, while a completely separate, equally common mistake (interpolating sensitive data into the message STRING) sits entirely outside what either fix pattern touches.'
    },
    {
      thought: 'Since interpolating a value into a template literal message string and passing it as a named object property both end up producing readable text in the final log output, they are functionally equivalent from a redaction/security standpoint.',
      reality: 'This subtopic\'s second code example shows these are NOT equivalent from redact\'s perspective — only the object-property version gives redact a named path it can match against and replace; the message-string version has no such structure for redact to operate on at all, regardless of what the final rendered text looks like.'
    }
  ];
}
