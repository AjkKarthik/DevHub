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
  templateUrl: './cognitive-load-has-three-types-platforms-target-one.html',
  styleUrl: './cognitive-load-has-three-types-platforms-target-one.scss'
})
export class CognitiveLoadHasThreeTypesPlatformsTargetOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats "reduce cognitive load" as one undifferentiated goal — the underlying theory splits it into three types with different treatment',
      points: [
        'The main page\'s own Quick Reference defines cognitive load generically: "Mental effort required to understand and work with a system — platform engineering aims to reduce it for developers." Every later mention treats reduction as a single, uniform goal — its own "Cognitive load shifted, not removed" mistake entry says only to "measure cognitive load" and "target < 5 decisions," without distinguishing what KIND of mental effort is being counted.',
        'Cognitive load theory (which Team Topologies draws its own framing from) defines three distinct types, each treated differently: Intrinsic cognitive load "relates to aspects of the task fundamental to the problem space" — the inherent complexity of the actual domain work. Extraneous cognitive load "relates to the environment in which the task is being done" — friction from tooling, process, and environment that has nothing to do with the task\'s real substance. Germane cognitive load "relates to aspects of the task that need special attention for learning or high performance" — productive mental effort spent getting better at something.',
        'These are not three flavors of the same problem to be minimized equally — the guidance is specifically to "eliminate extraneous cognitive load altogether" while PRESERVING capacity for the other two, since intrinsic load is inherent to the domain (a payments engineer genuinely needs to understand payment reconciliation) and germane load is where actual learning and skill-building happen.',
      ]
    },
    {
      heading: 'What this precision changes about designing and evaluating a platform',
      points: [
        'This gives the main page\'s own "Cognitive load shifted, not removed" mistake entry a sharper diagnostic than "count the decisions": the wrong example (8 custom CRDs, a 40-flag CLI, 3 dashboards) is a textbook case of REPLACING one form of extraneous load (raw Kubernetes complexity) with a NEW, DIFFERENT form of extraneous load (platform-specific tooling complexity) — neither is inherent to the actual problem domain (deploying a service), so neither should have existed as mental burden in the first place.',
        'A platform that reduces the WRONG kind of load can look successful by a naive "fewer decisions" count while making things worse — for example, an overly "smart" platform that auto-selects infrastructure choices on a developer\'s behalf might reduce decision COUNT while also silently removing germane load: a junior engineer who never has to reason about why a particular database or scaling config was chosen loses a genuine learning opportunity, not just an annoying chore.',
        'This reframes the main page\'s own "< 5 decisions" target as a proxy specifically for extraneous load, not total cognitive load — the goal is not to make developers think as little as possible about their service overall (that would also strip away useful intrinsic and germane load), but specifically to strip away the friction that has nothing to do with genuinely understanding or improving the thing they are building.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sorting the main page\'s own mistake example by cognitive load type',
      language: 'bash',
      code: `# The main page's own "Cognitive load shifted, not removed" wrong
# example, sorted into the three types:

# "8 custom CRDs, platform-specific YAML schema, internal CLI with
#  40 flags, 3 separate dashboards"

# --- EXTRANEOUS load (per the theory, should be eliminated) ---
# - Learning 8 CUSTOM CRDs invented by this specific platform team
#   (not standard Kubernetes, not the actual business domain)
# - Memorizing 40 CLI flags specific to this one internal tool
# - Cross-referencing 3 separate dashboards to understand one
#   deployment's status
# None of this is fundamental to "understand payment reconciliation"
# or "understand how my service should scale" -- it is 100%
# platform-specific tooling friction, invented BY the platform.

# --- INTRINSIC load (inherent -- should NOT be "optimized away") ---
# - Understanding what the SERVICE ITSELF actually does
#   (e.g. payment reconciliation rules, checkout business logic)
# This exists regardless of which platform tooling is used -- it is
# the real domain complexity the developer is PAID to understand.

# The main page's own "wrong" example replaced one set of extraneous
# load (raw Kubernetes YAML, kubectl flags) with an EQUALLY
# extraneous, merely DIFFERENT set (custom CRDs, a bespoke CLI) --
# net extraneous load unchanged, sometimes higher.`,
    },
    {
      label: 'A platform that reduces decision COUNT while removing germane load',
      language: 'typescript',
      code: `// A well-intentioned "smart" platform CLI that auto-selects
// infrastructure choices to minimize developer decisions:

interface ServiceRequest {
  name: string;
  expectedTrafficRps: number;
}

function provisionService(req: ServiceRequest) {
  // The platform silently picks EVERYTHING based on a heuristic --
  // zero decisions exposed to the developer:
  const dbTier = req.expectedTrafficRps > 100 ? 'db.r6g.large' : 'db.t3.micro';
  const minInstances = Math.ceil(req.expectedTrafficRps / 50);
  const cachingEnabled = req.expectedTrafficRps > 200;

  // Deploys with these auto-selected values -- developer never sees
  // WHY these choices were made, or what tradeoffs exist.
  return deploy({ ...req, dbTier, minInstances, cachingEnabled });
}

// This DOES reduce the "< 5 decisions" count the main page's own
// mistake entry targets -- zero decisions, in fact. But per this
// subtopic's theory, germane load ("aspects of the task that need
// special attention for learning or high performance") has ALSO
// been removed, not just extraneous load.
//
// A junior engineer who never reasons about "why db.r6g.large at
// this traffic level, and what happens if traffic 10x's?" loses a
// genuine opportunity to build real capacity-planning judgment --
// exactly the kind of germane load platform engineering's own
// underlying theory says should be PRESERVED, not stripped away
// alongside the extraneous complexity.
//
// A platform aligned with this subtopic's theory would instead
// surface the CHOICE with a sensible pre-filled default -- reducing
// EXTRANEOUS load (no need to know the exact instance-type naming
// scheme) while keeping the underlying tradeoff visible and
// adjustable (preserving germane load, the actual learning moment).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team proudly reports that their new deployment CLI reduced the "decisions per deployment" metric from 12 to 2, citing the main page\'s own "< 5 decisions" target as validation. Three months later, a senior engineer notices that new hires are taking significantly longer to debug production incidents than engineers who joined before the new CLI, because they don\'t understand why their services are configured the way they are. Using this subtopic\'s theory, explain what likely went wrong despite the metric improving, and what the platform team should check to diagnose it.',
    hint: 'Per this subtopic\'s theory, does reducing the RAW COUNT of decisions automatically mean only extraneous load was removed? Could some of those 10 removed decisions have been germane load — the kind of reasoning that builds the judgment needed to debug an unfamiliar production incident later?',
    solution: 'Per this subtopic\'s theory, a raw decision count going down does not distinguish WHICH type of cognitive load was actually removed — the platform team\'s "12 to 2" metric, exactly like the main page\'s own "< 5 decisions" target, is a proxy for extraneous load specifically, not a guarantee that only extraneous load was eliminated. The new hires\' debugging struggle is a strong signal that some of the ten removed decisions were germane load — "aspects of the task that need special attention for learning or high performance" — rather than pure friction. If the CLI now auto-selects database tiers, scaling thresholds, or caching configuration without ever surfacing the reasoning to the developer (exactly the pattern in this subtopic\'s second code example), new hires never build the judgment that comes from reasoning through those tradeoffs during normal development — leaving them without the mental model needed to debug an unfamiliar incident touching those same auto-selected choices later. The platform team should audit which of the ten removed decisions were genuinely extraneous (platform-specific tooling minutiae with no domain value, safe to eliminate) versus which ones required the developer to reason about a real tradeoff relevant to their service\'s actual behavior (germane, and should be surfaced with a sensible default rather than hidden entirely) — the fix is not necessarily re-adding all ten decisions, but distinguishing which few of them were actually teaching something.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Cognitive load is a single, undifferentiated quantity — the main page\'s own goal of "reducing cognitive load" means minimizing however much mental effort a developer experiences, across the board, as much as possible.',
      reality: 'This subtopic\'s theory distinguishes three types with different treatment: intrinsic (inherent to the domain, should not be stripped away), extraneous (pure friction, should be eliminated), and germane (productive learning effort, should be preserved). Treating all mental effort as equally worth minimizing risks removing the genuine domain understanding and learning opportunities alongside the actual friction.'
    },
    {
      thought: 'A platform that reduces the number of decisions a developer has to make (like the main page\'s own "< 5 decisions" target) has, by definition, successfully reduced cognitive load in the way platform engineering intends.',
      reality: 'This subtopic\'s exercise shows a reduced decision count can mask the removal of GERMANE load specifically — decisions that were actually building useful judgment, not just adding friction. The type of load being removed matters as much as the raw count, since the theory\'s actual guidance is to eliminate extraneous load specifically, not to minimize decisions in general.'
    },
    {
      thought: 'The main page\'s own "Cognitive load shifted, not removed" mistake (replacing raw Kubernetes complexity with custom CRDs and a 40-flag CLI) is really about the platform being poorly designed or overly complex, unrelated to any specific category of cognitive load.',
      reality: 'This subtopic\'s first code example shows the mistake is precisely a same-category swap — extraneous load (raw Kubernetes YAML) replaced with a different but equally extraneous load (custom, platform-specific tooling) — neither form having anything to do with the actual domain problem the developer is solving. Naming the category makes the diagnosis, and the fix (eliminate extraneous load, don\'t just relocate it), much more precise than "the platform is too complex."'
    }
  ];
}
