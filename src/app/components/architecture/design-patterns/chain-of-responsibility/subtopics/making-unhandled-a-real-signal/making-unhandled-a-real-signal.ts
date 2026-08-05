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
    heading: 'A Console.WriteLine Is Not a Signal the Caller Can Act On',
    points: [
      'The main page\'s own <code>DirectorApprover</code> — the LAST handler in the Approval Chain — handles ' +
      'the "nobody can approve this" case with ' +
      '<code>Console.WriteLine($"{request.Amount} requires board approval");</code>. This satisfies the ' +
      'theory\'s own warning against SILENTLY dropping unhandled requests, but only barely: a console line is ' +
      'not something calling code can inspect, branch on, or route differently.',
      'The QnA lists three real strategies for this exact situation — a default terminal handler, an explicit ' +
      'exception, or a null/empty result the caller checks — but the main page\'s own codeTab does none of ' +
      'these; it picks a fourth, weaker option (print and silently return) that the QnA never actually ' +
      'endorses.',
    ],
  },
  {
    heading: 'What "the Sender Gets No Response" Actually Costs Here',
    points: [
      'Because <code>Handle(ExpenseRequest request)</code> returns <code>void</code>, the caller of ' +
      '<code>lead.Handle(new ExpenseRequest(200_000))</code> has no way to programmatically learn the request ' +
      'reached the board-approval case — there is no return value, no exception, no event. Whatever code needs ' +
      'to actually ROUTE that request to a board-approval workflow has no signal to act on.',
      'This matters specifically because <code>DirectorApprover</code> genuinely IS the QnA\'s recommended ' +
      '"default terminal handler that catches any unhandled request" — it is positioned correctly, it just ' +
      'communicates its outcome the wrong way for that role.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Result Type Instead of a Console Line',
    language: 'csharp',
    code: `// A result type the caller can actually branch on — this is the
// "explicit signal that the request was unhandled" the main page's
// own theory names as one of the two acceptable strategies.
public enum ApprovalOutcome { Approved, RequiresBoardApproval }

public record ApprovalResult(ApprovalOutcome Outcome, string? ApprovedBy = null);

public abstract class ApprovalHandler
{
    private ApprovalHandler? _next;
    public ApprovalHandler SetNext(ApprovalHandler next) { _next = next; return next; }

    public abstract ApprovalResult Handle(ExpenseRequest request);

    protected ApprovalResult PassToNext(ExpenseRequest request) =>
        _next?.Handle(request)
        ?? new ApprovalResult(ApprovalOutcome.RequiresBoardApproval); // chain end, no next configured
}

public class TeamLeadApprover : ApprovalHandler
{
    public override ApprovalResult Handle(ExpenseRequest request) =>
        request.Amount <= 1_000
            ? new ApprovalResult(ApprovalOutcome.Approved, "TeamLead")
            : PassToNext(request);
}

// ... ManagerApprover follows the identical shape ...

public class DirectorApprover : ApprovalHandler
{
    public override ApprovalResult Handle(ExpenseRequest request) =>
        request.Amount <= 100_000
            ? new ApprovalResult(ApprovalOutcome.Approved, "Director")
            : new ApprovalResult(ApprovalOutcome.RequiresBoardApproval); // explicit, inspectable signal

}

// Caller can now genuinely ROUTE based on the outcome, not just read a log:
var result = lead.Handle(new ExpenseRequest(200_000));
if (result.Outcome == ApprovalOutcome.RequiresBoardApproval)
    boardApprovalQueue.Enqueue(request); // real routing logic, not a print statement`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The fixed <code>PassToNext</code> above returns a default ' +
    '<code>RequiresBoardApproval</code> result when <code>_next</code> is null, instead of returning ' +
    '<code>null</code> or throwing. Which of the QnA\'s three named strategies does this correspond to, and ' +
    'why might a THROWN exception have been a worse choice specifically for this chain?',
  hint:
    'Think about what "the chain end acts as an implicit default terminal handler" versus "the chain end ' +
    'throws because nothing handled it" would each mean for a caller who forgot to wire a proper ' +
    'DirectorApprover-equivalent onto the end of a shorter, custom-built chain.',
  solution:
    'This corresponds to the QnA\'s "default handler" strategy — the chain\'s own end-of-chain fallback acts ' +
    'as an implicit terminal handler, exactly like the QnA\'s own "root logger acts as a default catch-all" ' +
    'example. A thrown exception would be a worse choice here specifically because reaching the end of the ' +
    'chain is not necessarily an ERROR condition in this domain — a sufficiently large legitimate expense IS ' +
    'expected to require board approval as a matter of normal business process, not as an exceptional failure. ' +
    'Using an exception for expected, valid business outcomes forces every caller to wrap ordinary large-' +
    'expense requests in a try/catch, conflating "this is how the business process is supposed to work" with ' +
    '"something went wrong" — the ApprovalResult return value keeps that distinction clear.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since DirectorApprover already prints a message when a request needs board approval, the "no ' +
      'silent drop" requirement from the theory is already satisfied.',
    reality:
      '"Not silent" and "actionable" are different bars. A console message satisfies a human watching the ' +
      'logs at that exact moment, but it gives calling CODE nothing to act on — no return value, no exception, ' +
      'no event a downstream workflow could subscribe to. The theory\'s own warning is really about the CALLER ' +
      'being able to detect and respond to the unhandled case programmatically, not merely about a human being ' +
      'able to notice it in a log file.',
  },
  {
    thought: 'Adding a proper result type to every handler in the chain is unnecessary ceremony for what a ' +
      'Console.WriteLine already communicates well enough.',
    reality:
      'The ceremony is proportional to what the unhandled case actually needs to trigger next — if "print a ' +
      'log line" really is the entire required behavior, the original code was fine. The moment ANY downstream ' +
      'system (a board-approval queue, a notification, a dashboard) needs to react to that outcome, a ' +
      'genuine, inspectable signal stops being optional — and retrofitting one later means touching every ' +
      'handler\'s signature, which is exactly why choosing the right shape at the start (as this hub\'s own ' +
      'discussion of "runtime-assembled, reconfigurable chains" already emphasizes) pays off.',
  },
];

@Component({
  selector: 'app-cor-making-unhandled-a-real-signal',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './making-unhandled-a-real-signal.html',
  styleUrl: './making-unhandled-a-real-signal.scss',
})
export class MakingUnhandledARealSignalSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
