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
  templateUrl: './shared-process-shared-failure-domain.html',
  styleUrl: './shared-process-shared-failure-domain.scss'
})
export class SharedProcessSharedFailureDomainSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A tradeoff the main page never states directly, despite covering almost every other angle',
      points: [
        'The main page thoroughly covers logical decoupling (module boundaries, typed APIs, independent schemas), migration mechanics (Strangler Fig), and WHEN to split (scale bottleneck, team independence, technology fit) — but never explicitly names the flip side of staying a single deployable unit: every module in a modular monolith shares ONE operating-system process, and therefore shares its FAILURE DOMAIN.',
        'A modular monolith gives you logical isolation (module A cannot directly call module B\'s internals) without giving you OPERATIONAL isolation (module A cannot be prevented from crashing, hanging, or exhausting memory in a way that takes module B down with it) — these are two genuinely different kinds of isolation, and a well-structured modular monolith only provides the first one.',
      ]
    },
    {
      heading: 'Concrete failure modes this creates',
      points: [
        'An unhandled exception or an uncaught promise rejection in ONE module\'s code can crash the entire process — every other module goes down too, even ones that were working perfectly and had no bugs of their own.',
        'A memory leak in one module (e.g. an unbounded cache, a subscription that\'s never cleaned up) grows the SAME process heap every other module shares — eventually triggering an out-of-memory kill that takes the whole application down, not just the leaking module.',
        'A CPU-intensive operation in one module (a large synchronous computation, a poorly-optimized query result being processed in-memory) can starve the event loop or thread pool for every OTHER module\'s requests too, since they all run on the same runtime.',
        'True microservices avoid all three of these specific failure modes by construction — a crash, memory leak, or CPU spike in one service\'s own process cannot directly take down a different service\'s separate process, even though the services can still fail each other INDIRECTLY (e.g. one service being slow makes a caller that depends on it slow too).',
      ]
    },
    {
      heading: 'Why this matters for the split-or-don\'t-split decision the main page already covers',
      points: [
        'The main page\'s own split criteria (scale bottleneck, team independence, technology fit) are all about DEVELOPMENT and DEPLOYMENT concerns — this failure-domain tradeoff is a RUNTIME RELIABILITY concern the page doesn\'t explicitly name as a fourth, legitimate reason to consider splitting: a module whose failure modes (frequent crashes, unpredictable memory usage, unbounded CPU spikes) pose a genuine risk to every OTHER module\'s uptime is a candidate for process-level isolation, independent of whether it also needs independent scaling or a separate team.',
        'This doesn\'t change the main page\'s core recommendation (start with a modular monolith, split on genuine evidence) — it adds a specific, concrete KIND of evidence ("this module\'s failures are taking down the whole app") that belongs alongside the scale/team/technology criteria the page already lists.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Logical isolation vs. operational isolation',
      language: 'typescript',
      code: `interface IsolationGuarantee {
  kind: 'logical' | 'operational';
  providedBy: string;
  example: string;
}

const modularMonolithGuarantees: IsolationGuarantee[] = [
  {
    kind: 'logical',
    providedBy: 'Module boundaries, typed public APIs, independent schemas',
    example: "Orders module can't directly import Inventory's internal classes",
  },
  // Notably ABSENT from a modular monolith:
  // { kind: 'operational', providedBy: 'separate OS process', ... }
];

const microservicesGuarantees: IsolationGuarantee[] = [
  {
    kind: 'logical',
    providedBy: 'Network API boundary (HTTP/gRPC), separate deployables',
    example: "Orders service can't call Inventory's internal code at all -- different process",
  },
  {
    kind: 'operational',
    providedBy: 'Separate OS process per service',
    example: "Inventory service crashing doesn't take down the Orders service's own process",
  },
];

// A modular monolith's own failure-domain gap, concretely:
function simulateSharedProcessFailure() {
  // A bug in ONE module...
  function inventoryModuleBug() {
    throw new Error('Unhandled: inventory sync failed');
    // In a modular monolith: crashes the WHOLE process --
    // Orders, Customers, every other module goes down too.
    // In microservices: only the Inventory service's own process dies;
    // Orders and Customers keep running (though calls TO Inventory
    // will now fail or need to be handled via retries/circuit breakers).
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has built a well-structured modular monolith -- strict module boundaries, typed APIs, independent schemas per module, exactly as this page recommends. One module has a memory leak that eventually triggers an out-of-memory crash. What happens to the OTHER modules, and would the outcome be different in a microservices architecture?',
    hint: 'Do all the modules in a modular monolith run inside the same operating-system process, or separate ones?',
    solution: 'In the modular monolith, ALL modules run inside the same single process -- when the leaking module\'s memory growth eventually triggers an out-of-memory crash, the ENTIRE process dies, taking every other module down with it, even ones that have no bugs of their own. In a microservices architecture, each service runs in its own separate process (and typically its own container) -- the leaking service\'s process would crash and could be restarted independently, while the other services keep running (though any service that depends on the crashed one would need to handle it being temporarily unavailable, e.g. via retries or a circuit breaker). This is the key operational-isolation benefit microservices provide that a modular monolith, however well-structured, does not: logical module boundaries prevent accidental coupling in the CODE, but they don\'t prevent one module\'s runtime failure from affecting every other module\'s uptime.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A well-structured modular monolith (strict module boundaries, typed APIs, independent schemas) provides essentially the same isolation benefits as microservices, just without the network overhead.',
      reality: 'Per this subtopic\'s theory, a modular monolith provides LOGICAL isolation (preventing accidental code coupling) but not OPERATIONAL isolation (preventing one module\'s crash, memory leak, or CPU spike from affecting every other module) — these are genuinely different guarantees, and only true process-per-service microservices provide the second one.'
    },
    {
      thought: 'The main page\'s criteria for when to split into microservices (scale bottleneck, team independence, technology fit) cover every legitimate reason a team might need process-level isolation.',
      reality: 'Per this subtopic\'s theory, a module whose failure modes (frequent crashes, unpredictable memory growth, CPU spikes) pose a genuine risk to the rest of the application\'s uptime is a distinct, additional legitimate reason to consider splitting it out — a runtime-reliability concern, not a development/deployment concern like the page\'s existing three criteria.'
    },
    {
      thought: 'Since a modular monolith deploys as a single unit, any crash or resource exhaustion issue would be immediately obvious and easy to attribute to the specific module that caused it, making the shared-process risk manageable in practice.',
      reality: 'Per this subtopic\'s theory, a shared-process crash takes down EVERY module at once, not just the one that caused it — from the outside, the failure looks like "the whole application went down," and root-causing which specific module\'s bug actually triggered it requires its own investigation, unlike microservices where the crashed process itself already identifies which service failed.'
    }
  ];
}
