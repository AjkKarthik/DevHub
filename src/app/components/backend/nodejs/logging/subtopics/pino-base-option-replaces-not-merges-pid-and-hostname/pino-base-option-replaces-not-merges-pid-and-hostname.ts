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
  templateUrl: './pino-base-option-replaces-not-merges-pid-and-hostname.html',
  styleUrl: './pino-base-option-replaces-not-merges-pid-and-hostname.scss'
})
export class PinoBaseOptionReplacesNotMergesPidAndHostnameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Pino structured logging example configures base: { service: \'api\', version: process.env.npm_package_version } — a reasonable-looking way to tag every log line with service identity, that silently costs the codebase two fields it never realized it was giving up',
      points: [
        'Per Pino\'s own official API documentation, the base option\'s documented default value is exactly { pid: process.pid, hostname: os.hostname() } — meaning, out of the box, every single Pino log line automatically includes which OS process (by PID) and which physical/virtual host emitted it, with zero configuration required.',
        'This default is a single VALUE for the option, not a set of fields merged in additively alongside whatever else gets configured. Explicitly setting base: { service: \'api\', version: ... } — exactly as the main page\'s own code sample does — REPLACES that entire default outright. pid and hostname are not merged in alongside service and version; they simply stop appearing in log output at all, the moment base is explicitly set to anything else.',
        'This is easy to miss because nothing about the resulting log lines looks obviously broken — they still contain plenty of useful structured fields (service, version, requestId, and so on from child loggers). The absence of pid/hostname is a silent omission, not a visible error, and the main page\'s own code sample demonstrates exactly this configuration with no indication that those two identifying fields have quietly disappeared from every log line the moment base was customized.',
      ]
    },
    {
      heading: 'Why pid and hostname matter enough to be worth deliberately keeping',
      points: [
        'In any deployment running more than one instance of a service (cluster mode, multiple containers, horizontal scaling — exactly the kind of setup this hub\'s own performance and architecture topics cover), pid and hostname are often the ONLY fields in a log line that let an engineer distinguish "which specific process/host actually produced this specific log entry" during an incident — a detail that becomes genuinely important when correlating a spike in errors with a specific unhealthy instance, or ruling out that only one particular pod/container is misbehaving.',
        'The fix, since base genuinely replaces rather than merges: manually include the values Pino would otherwise have defaulted to, inside the SAME custom base object — base: { pid: process.pid, hostname: os.hostname(), service: \'api\', version: ... } — getting both the custom identification fields AND the defaults Pino would have provided automatically, in one explicit, intentional configuration.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own config — pid and hostname silently gone',
      language: 'typescript',
      code: `import pino from 'pino';

// The main page's own exact configuration:
const logger = pino({
  level:  process.env.LOG_LEVEL ?? 'info',
  redact: ['body.password', 'headers.authorization', '*.token'],
  base:   { service: 'api', version: process.env.npm_package_version },
  // ...
});

logger.info('Server started');
// Output — NO pid, NO hostname anywhere in this line, even though
// Pino's own documented DEFAULT would normally include both:
// {"level":30,"service":"api","version":"1.4.2","msg":"Server started","time":...}
//
// Compare to what a plain pino() with no base override produces:
// {"level":30,"pid":48213,"hostname":"api-worker-3","msg":"Server started","time":...}
// The pid/hostname fields are simply GONE the moment base is set
// to anything custom — not merged, replaced entirely.`,
    },
    {
      label: 'The fix: include the defaults explicitly alongside custom fields',
      language: 'typescript',
      code: `import pino from 'pino';
import os from 'node:os';

const logger = pino({
  level:  process.env.LOG_LEVEL ?? 'info',
  redact: ['body.password', 'headers.authorization', '*.token'],
  base: {
    pid:      process.pid,       // manually restore Pino's own default
    hostname: os.hostname(),     // manually restore Pino's own default
    service:  'api',             // the custom field the team actually wanted
    version:  process.env.npm_package_version,
  },
});

logger.info('Server started');
// Output now includes BOTH the custom fields AND the identifying
// defaults Pino would have provided on its own, in one explicit,
// deliberate configuration:
// {"level":30,"pid":48213,"hostname":"api-worker-3","service":"api","version":"1.4.2","msg":"Server started","time":...}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a Node.js API in Kubernetes with 6 replica pods, each configured with the main page\'s own base: { service: \'api\', version: ... } Pino setup. During an incident, error logs spike in their log aggregation dashboard, and the on-call engineer needs to determine whether the errors are coming from all 6 pods evenly or concentrated on just one unhealthy pod — but every log line looks structurally identical across pods except for the requestId field. Why can\'t the engineer distinguish which pod produced which log line from the logs alone, and what change to the logger configuration would fix this for future incidents?',
    hint: 'What field would normally let you tell which specific host/container produced a given log line, and does the current base configuration include it, given how base actually behaves when explicitly set?',
    solution: 'The engineer cannot distinguish which pod produced which log line because the current base configuration (base: { service: \'api\', version: ... }) has REPLACED Pino\'s own default base object entirely — and that default is specifically the pair of fields ({ pid, hostname }) that would normally let someone tell which process and which host/container emitted a given log line. Since Pino\'s base option replaces rather than merges with its default, explicitly setting it to a custom object without including pid/hostname means those two identifying fields are silently absent from every log line across all 6 pods — they all just show service, version, and whatever request-specific fields (like requestId) get added via child loggers, with nothing distinguishing WHICH of the 6 identical-looking pods actually produced any given entry. The fix for future incidents is updating the base configuration to manually include Pino\'s own would-be defaults alongside the custom fields: base: { pid: process.pid, hostname: os.hostname(), service: \'api\', version: ... } — this restores per-pod identification (hostname specifically, since in Kubernetes the hostname typically corresponds to the pod name) without giving up the custom service/version tagging the team already wanted, letting future incidents immediately show which specific pod\'s logs are spiking.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Pino\'s base option, when explicitly configured with custom fields, adds those fields ON TOP OF the library\'s own default { pid, hostname } base object — both the custom and default fields should appear together in log output.',
      reality: 'This subtopic\'s theory and first code example both show the opposite — Pino\'s own documentation confirms base has a single default VALUE that gets entirely REPLACED, not merged with, when explicitly set to anything else, meaning pid and hostname disappear the moment a custom base object is configured.'
    },
    {
      thought: 'The main page\'s own Pino configuration example (base: { service: \'api\', version: ... }) is complete and correct as shown, with no meaningful information silently lost compared to Pino\'s default behavior.',
      reality: 'This subtopic\'s theory and exercise both show this specific configuration silently drops the pid and hostname fields Pino would otherwise include automatically — information that becomes genuinely important for distinguishing which process/host produced a given log line in any multi-instance deployment.'
    },
    {
      thought: 'Since pid and hostname are Pino\'s own automatic defaults, there is no way to have both those defaults AND custom base fields like service/version at the same time — it\'s an either/or choice.',
      reality: 'This subtopic\'s second code example shows this is not actually an either/or tradeoff — manually including process.pid and os.hostname() inside the SAME custom base object restores both the defaults and the custom fields together, since the limitation is specifically that base replaces its OWN default value, not that pid/hostname can never coexist with custom fields.'
    }
  ];
}
