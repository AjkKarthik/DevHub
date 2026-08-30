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
  templateUrl: './challenge-solution-missing-real-adapter.html',
  styleUrl: './challenge-solution-missing-real-adapter.scss'
})
export class ChallengeSolutionMissingRealAdapterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The hints named a real adapter the solution never actually built',
      points: [
        'The Challenge\'s own hints state: "Composition root: new SendNotificationCli(new SendNotificationUseCase(new SmtpGateway()))" — explicitly naming a production SMTP adapter. But the ORIGINAL solution\'s composition root only ever constructed InMemoryNotificationGateway, and never defined or used any SMTP-based class at all. The page has been corrected to add a real SmtpNotificationGateway adapter and wire it at a (separate) production composition root, alongside the existing in-memory one used for tests.',
        'This directly violates the page\'s own stated rule, repeated in two separate places: revision\'s mustKnow ("Every secondary port should have at least two adapters: real + in-memory") and the QnA ("How many adapters should each port have? At minimum two: the real implementation... and a test double"). The Challenge\'s own reference solution — the example meant to demonstrate the pattern correctly — only had ONE.',
      ]
    },
    {
      heading: 'Why "at least two adapters" is the actual point of the whole pattern, not an arbitrary rule',
      points: [
        'The mistakes block\'s own "Having only one adapter per port" entry states it plainly: "If you only have one, you have not implemented ports & adapters — just an interface." A secondary port with a single implementation provides indirection without the actual PAYOFF of hexagonal architecture, which is the ability to swap implementations (a real one for production, a fast fake for tests) without touching the core.',
        'A Challenge solution with only one adapter doesn\'t just under-demonstrate the pattern — it demonstrates something that, by the page\'s own definition, isn\'t genuinely "ports & adapters" yet, since there\'s nothing being swapped.',
      ]
    },
    {
      heading: 'The fix: a real adapter alongside the test double, exactly as the hints already specified',
      points: [
        'The corrected solution adds SmtpNotificationGateway implements INotificationGateway as the production adapter, matching the SmtpGateway named in the hints (renamed slightly to match the INotificationGateway interface\'s own naming), and wires it at its own composition root — separate from the test-focused composition root that still uses InMemoryNotificationGateway.',
        'Both composition roots construct the exact SAME SendNotificationUseCase and SendNotificationCli classes — only the injected gateway differs — which is itself a working demonstration of the core benefit the page has been arguing for throughout: the application core and driving adapter are completely unaware of which secondary adapter they\'re wired to.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One adapter (violates the rule) vs. two (satisfies it)',
      language: 'typescript',
      code: `// BEFORE: only ONE adapter ever implements INotificationGateway --
// the page's own mistakes block calls this "not actually ports &
// adapters, just an interface."
class InMemoryNotificationGateway implements INotificationGateway {
  sent: Array<{ recipient: string; message: string }> = [];
  async send(recipient: string, message: string): Promise<void> {
    this.sent.push({ recipient, message });
  }
}

const useCaseOnlyOneAdapter = new SendNotificationUseCase(
  new InMemoryNotificationGateway()   // the ONLY adapter that exists
);
// Nothing to swap -- the "port" is decorative, not load-bearing.

// AFTER: a real production adapter alongside the test double --
// matching the hints' own explicit mention of an SMTP gateway.
class SmtpNotificationGateway implements INotificationGateway {
  constructor(private smtpConfig: SmtpConfig) {}
  async send(recipient: string, message: string): Promise<void> {
    await sendMail(this.smtpConfig, recipient, message);
  }
}

// Production composition root:
const prodUseCase = new SendNotificationUseCase(
  new SmtpNotificationGateway(smtpConfig)
);

// Test composition root -- SAME use case and CLI classes, only the
// injected adapter changes:
const testUseCase = new SendNotificationUseCase(
  new InMemoryNotificationGateway()
);
// THIS is what "ports & adapters" actually buys: swapping the
// secondary adapter with zero changes to the core or driving adapter.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Challenge\'s hints explicitly mention "new SmtpGateway()" in a composition-root example, but the reference solution never defines any SMTP-related class -- only an InMemoryNotificationGateway is ever constructed. The page\'s own mistakes block states that having only one adapter per port "is not actually ports & adapters, just an interface." What is the gap, and why does it matter beyond just following the hints literally?',
    hint: 'If a secondary port has exactly one implementation anywhere in the codebase, is there anything left to actually SWAP -- and does the pattern\'s core benefit (swappability) still apply?',
    solution: 'The gap is that the solution only ever defines and uses ONE adapter (InMemoryNotificationGateway) for the INotificationGateway secondary port, despite the hints explicitly naming a production SmtpGateway that never gets built. This matters beyond just "following the hints" because the page\'s own mistakes block states that a single-adapter port isn\'t genuinely demonstrating ports & adapters at all -- there\'s nothing to swap, so the indirection of the interface provides no actual benefit. The fix adds a real SmtpNotificationGateway implementing the same INotificationGateway interface, wired at its own production composition root alongside the existing test-focused one -- with the SAME SendNotificationUseCase and SendNotificationCli classes used unchanged in both, which is exactly the swappability the pattern is meant to demonstrate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Challenge\'s hints and its reference solution should be expected to match exactly on every named detail, so if the hints mention a class the solution doesn\'t build, it\'s likely just an inconsequential naming inconsistency.',
      reality: 'Per this subtopic\'s theory, the missing SmtpGateway wasn\'t a naming inconsistency — it was a genuine gap where the solution never satisfied the page\'s own "at least two adapters" rule at all, since the hints\' mentioned production adapter was never built in ANY form, under any name.'
    },
    {
      thought: 'For a Challenge specifically about writing an in-memory test adapter (as this one\'s requirements state), it\'s reasonable for the reference solution to skip the production adapter entirely, since the stated task is about testing.',
      reality: 'Per this subtopic\'s theory, the page\'s own rule ("every secondary port should have at least two adapters: real + in-memory") isn\'t scoped to only apply when a Challenge explicitly asks for both — it\'s presented as a general principle, and a reference solution that violates it while demonstrating the pattern undercuts the very lesson the Challenge is meant to teach.'
    },
    {
      thought: 'Having a single, well-implemented adapter for a secondary port is still meaningfully "ports & adapters" as long as the interface itself is correctly defined and the core depends only on the interface, not a concrete class.',
      reality: 'Per this subtopic\'s theory, the page\'s own mistakes block explicitly disagrees with this: a port with exactly one implementation "is not actually ports & adapters, just an interface" — the DEFINING benefit of the pattern is swappability, which requires at least two real implementations to actually exist and be demonstrated.'
    }
  ];
}
