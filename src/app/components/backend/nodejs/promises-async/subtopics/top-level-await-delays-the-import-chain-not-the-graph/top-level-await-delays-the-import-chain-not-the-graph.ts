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
  templateUrl: './top-level-await-delays-the-import-chain-not-the-graph.html',
  styleUrl: './top-level-await-delays-the-import-chain-not-the-graph.scss'
})
export class TopLevelAwaitDelaysTheImportChainNotTheGraphSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s theory mentions top-level await exists ("await db.connect() at the top level of a .mjs file") but never says what happens to code that IMPORTS a module using it — the effect reaches further than the module itself',
      points: [
        'Per the TC39 top-level-await proposal\'s own explainer: "When one module imports another one, the importing module will only start executing its module body once the dependency\'s body has finished executing. If the dependency reaches a top-level await, that will have to complete before the importing module\'s body starts executing." This is not a special case for top-level await specifically — it is simply how ES module evaluation ordering already works, extended to cover the fact that a module\'s body can now itself pause on an await.',
        'The precise scope: this delay propagates transitively along the IMPORT CHAIN — every module that imports the async module, directly or indirectly, has its own body execution delayed until that top-level await resolves. It is NOT the entire application\'s module graph that pauses — sibling branches of the graph that do not depend on the async module at all continue evaluating on their own schedule, unaffected.',
        'Concretely: if db.mjs does top-level await db.connect(), and server.mjs does import "./db.mjs", then server.mjs\'s own module body does not start running until that connection resolves. But if logger.mjs is imported by main.mjs completely independently of db.mjs, logger.mjs\'s evaluation is NOT held up by db.mjs\'s await at all — only modules actually sitting along the dependency chain to db.mjs are affected.',
      ]
    },
    {
      heading: 'Why this matters for application startup time and design',
      points: [
        'A slow top-level await deep in a commonly-imported module (a database connection, a remote config fetch, a dynamic feature-flag lookup) can meaningfully delay the startup of every module that transitively depends on it — even ones that don\'t obviously look related to whatever that await is waiting on, simply because they happen to import something that imports something that imports the slow module.',
        'This is a real, spec-defined tradeoff of adopting top-level await for startup-critical resources: it guarantees the resource is ready before any dependent code runs (no accidental "use before ready" race), at the cost of a real serialization point in what would otherwise be independently-loadable modules. For resources that don\'t need to block dependent modules\' mere DEFINITION (as opposed to their actual invocation), a regular async function called later — rather than a bare top-level await — avoids this specific tradeoff.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A slow top-level await delays every importer along the chain',
      language: 'typescript',
      code: `// db.mjs — a slow top-level await
export const connection = await createDbConnection(); // takes ~2 seconds
console.log('db.mjs finished evaluating');

// users-repo.mjs — imports db.mjs directly
import { connection } from './db.mjs';
// This module's OWN body does not start running until db.mjs's
// top-level await resolves — even though users-repo.mjs itself has
// no await of its own.
console.log('users-repo.mjs finished evaluating');
export function findUser(id) { return connection.query(...); }

// server.mjs — imports users-repo.mjs (which imports db.mjs)
import { findUser } from './users-repo.mjs';
// This module ALSO waits — the delay propagates transitively along
// the whole chain, not just the module that directly imports db.mjs.
console.log('server.mjs finished evaluating — ready to listen');
app.listen(3000);

// Console output timing: ~2 second gap before ANY of these three
// "finished evaluating" lines appear, then all three appear in order.`,
    },
    {
      label: 'An UNRELATED module is NOT delayed by the same top-level await',
      language: 'typescript',
      code: `// logger.mjs — has NOTHING to do with db.mjs
export function log(msg) { console.log(\`[LOG] \${msg}\`); }
console.log('logger.mjs finished evaluating');

// main.mjs — imports BOTH server.mjs (which transitively imports the
// slow db.mjs) AND logger.mjs (which has no such dependency)
import { log } from './logger.mjs';
import './server.mjs'; // this import is what's slow

// logger.mjs's own evaluation is NOT held up by db.mjs's top-level
// await — "logger.mjs finished evaluating" can print well before the
// ~2 second db.mjs delay resolves, since logger.mjs sits on a
// completely separate branch of the import graph.
log('main.mjs starting up');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds a top-level await featureFlags = await fetchRemoteConfig() to a shared config.mjs module used by dozens of other modules across a large application. After deploying, they notice the app\'s startup time increased noticeably, and — puzzlingly — even modules that never explicitly import config.mjs seem to start up slower too. Are both of these observations consistent with how top-level await actually works, or is the second one a red flag suggesting something else is wrong?',
    hint: 'Does top-level await\'s delay affect the ENTIRE module graph uniformly, or specifically the modules that import — directly or transitively — the module containing the await? What would explain a module that has genuinely NO import relationship to config.mjs also slowing down?',
    solution: 'The first observation (overall startup time increasing) is fully consistent with how top-level await works — since config.mjs is imported (directly or transitively) by dozens of other modules, all of those importers now wait for fetchRemoteConfig() to resolve before their own module bodies can run, which is exactly the documented transitive-delay behavior. The second observation, however, IS a red flag if truly verified — top-level await\'s specification-defined behavior only delays modules that actually sit along the import chain to the awaiting module; a module with genuinely zero import relationship (direct or transitive) to config.mjs should NOT be affected by its top-level await at all, since ES module evaluation ordering only serializes along actual dependency edges, not across the whole graph indiscriminately. If an apparently-unrelated module really is slower, the far more likely explanation is that it is NOT actually unrelated — it probably imports something that imports something that eventually imports config.mjs, and tracing that hidden transitive dependency (rather than assuming top-level await somehow affects unrelated code) is the right next debugging step.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A top-level await in one ES module only delays access to THAT module\'s own exports for whatever code directly imports it — modules further up an import chain are unaffected.',
      reality: 'This subtopic\'s theory and first code example both show the delay propagates TRANSITIVELY — every module that imports the async module, directly or indirectly, has its own body evaluation held up, not just the module with the direct import.'
    },
    {
      thought: 'A slow top-level await anywhere in an application\'s module graph delays the evaluation of every other module in that same application, since JavaScript module loading is a single serialized process.',
      reality: 'This subtopic\'s second code example shows the opposite — only modules actually sitting along the import chain to the async module are delayed; a module with no dependency relationship to it evaluates on its own schedule, completely unaffected.'
    },
    {
      thought: 'Using top-level await for a startup-critical resource (a database connection, a remote config fetch) has no real tradeoff compared to fetching it asynchronously later inside a function.',
      reality: 'This subtopic\'s theory identifies a genuine tradeoff — top-level await guarantees the resource is ready before dependent modules\' bodies run (avoiding a use-before-ready race), but at the cost of a real serialization point that can meaningfully delay every transitive importer\'s startup, which a later async function call inside those modules would avoid.'
    }
  ];
}
