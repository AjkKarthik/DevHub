import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Variant Named in the QnA, Never Shown in the Approval Chain',
    points: [
      'The main page\'s own QnA states: "Can a handler both process a request AND pass it to the next ' +
      'handler? Yes — this is the \'pass-through with side effect\' variant. Logging and metrics handlers ' +
      'always call next() after recording their data." — but the main page\'s own <code>ApprovalHandler</code> ' +
      'chain never demonstrates this; every concrete handler there either fully handles the request (and ' +
      'stops) or fully defers to the next handler, with nothing in between.',
      'The Middleware codeTab\'s own logging middleware DOES do this (<code>await next(context)</code> always ' +
      'runs), but ' +
      'it is written as a raw ASP.NET Core delegate, not as an <code>ApprovalHandler</code>-shaped class — so ' +
      'the main page never shows what this variant looks like using its OWN handler abstraction.',
    ],
  },
  {
    heading: 'Why This Genuinely Overlaps With Decorator (and Why That\'s Fine)',
    points: [
      'The QnA itself acknowledges the overlap: "This overlaps with Decorator, but the structural setup (a ' +
      'chain assembled at runtime vs static wrapping) still classifies it as CoR." A pass-through-with-' +
      'side-effect handler behaves EXACTLY like a Decorator for that one request (always forwards, adds ' +
      'behavior around the call) — the distinction is about the SURROUNDING STRUCTURE, not this handler in ' +
      'isolation.',
      'What keeps it genuinely CoR rather than Decorator: it sits in the SAME chain as handlers that CAN ' +
      'short-circuit (TeamLeadApprover, ManagerApprover) — the chain as a whole still has the short-circuiting ' +
      'property CoR requires, even though this ONE link in it always passes through.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'An Audit Handler in the Approval Chain',
    language: 'csharp',
    code: `// Reuses the main page's own ApprovalHandler / PassToNext infrastructure.
// This handler ALWAYS calls next — it never decides the outcome, only
// observes and records every request that flows through this point.
public class AuditLogHandler : ApprovalHandler
{
    public override void Handle(ExpenseRequest request)
    {
        Console.WriteLine($"[AUDIT] Expense request for {request.Amount:C} entered the chain " +
                           $"at {DateTime.UtcNow:O}");

        // Always forwards — this handler never approves or rejects anything.
        // It behaves exactly like a Decorator for this one link, but the
        // CHAIN it participates in still has other links that CAN stop.
        PassToNext(request);
    }
}

// Wire it FIRST in the chain — every request gets audited before any
// approval decision is made, regardless of which handler ultimately
// approves it or whether the chain falls through unhandled.
var audit    = new AuditLogHandler();
var lead     = new TeamLeadApprover();
var manager  = new ManagerApprover();
var director = new DirectorApprover();
audit.SetNext(lead).SetNext(manager).SetNext(director);

audit.Handle(new ExpenseRequest(500));    // [AUDIT] ... then TeamLead approved
audit.Handle(new ExpenseRequest(200_000)); // [AUDIT] ... then Board required`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues <code>AuditLogHandler</code> should just be written as a plain Decorator wrapping the ' +
    'whole chain (<code>new AuditingDecorator(lead)</code>) instead of being a link INSIDE the chain. What is ' +
    'the practical difference between those two placements, given that both approaches always forward the ' +
    'call?',
  hint:
    'Think about what a Decorator wrapping the WHOLE chain can observe versus a handler sitting AT A SPECIFIC ' +
    'POINT inside the chain — could you have two audit points, one before TeamLead and one before Director, ' +
    'with each approach?',
  solution:
    'A Decorator wrapping the entire chain can only observe the request going in and the final result coming ' +
    'out — it has no visibility into WHICH handler inside the chain actually processed it, or how far the ' +
    'request traveled before something happened. An AuditLogHandler placed AS A LINK inside the chain can be ' +
    'positioned at any specific point — before TeamLead, between Manager and Director, or in multiple places ' +
    'at once — recording exactly how far a given request got and observing state at that precise point in the ' +
    'sequence. This is the real practical payoff of using CoR\'s own mechanism for a pass-through handler ' +
    'instead of an outer Decorator: fine-grained placement WITHIN the sequence, not just wrapping around the ' +
    'outside of it.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A handler that always calls next() is not "really" participating in Chain of Responsibility — ' +
      'it should not even be modeled as a handler.',
    reality:
      'The QnA on this very page explicitly validates this variant as legitimate CoR — what defines a CoR ' +
      'handler is that it COULD have stopped propagation (it has the option, the same PassToNext mechanism ' +
      'every other handler uses), not that it always exercises that option. A logging or auditing link that ' +
      'always forwards is still assembled, positioned, and wired exactly like any other handler in the chain.',
  },
  {
    thought: 'Since this handler behaves just like a Decorator for any single request, calling it a CoR ' +
      'handler instead is purely a matter of preference.',
    reality:
      'The classification tracks the STRUCTURE it participates in, not the behavior of one isolated link — a ' +
      'chain containing both always-forwarding links (audit) and conditionally-stopping links (approvers) is ' +
      'a CoR chain as a whole, assembled and reconfigurable at runtime via SetNext(), which is a genuinely ' +
      'different structural commitment than Decorator\'s fixed, static nesting.',
  },
];

@Component({
  selector: 'app-cor-pass-through-with-side-effect-handler',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pass-through-with-side-effect-handler.html',
  styleUrl: './pass-through-with-side-effect-handler.scss',
})
export class PassThroughWithSideEffectHandlerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
