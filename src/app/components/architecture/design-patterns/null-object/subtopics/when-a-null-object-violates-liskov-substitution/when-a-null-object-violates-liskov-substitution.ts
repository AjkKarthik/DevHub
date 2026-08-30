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
    heading: 'A Sharp Warning, Stated Once, Never Shown Breaking',
    points: [
      'The main page\'s own QnA states it plainly: "A Null Object that throws ' +
      '<code>NotImplementedException</code> on some methods violates LSP and is worse than a null check." ' +
      'This is a strong, specific claim — worse than a null check — but neither codeTab on the page ever ' +
      'shows a Null Object that actually does this, so the claim is never tested against real code.',
      'Every Null Object the main page DOES show (<code>NullLogger</code>, <code>NoDiscount</code>) genuinely ' +
      'implements every single method of its interface as a real no-op — none of them cut this corner, which ' +
      'is exactly why the failure mode the QnA warns about never surfaces anywhere else on the page.',
    ],
  },
  {
    heading: 'Why "Worse Than a Null Check" Is Literally True Here',
    points: [
      'A genuine <code>null</code> reference fails IMMEDIATELY and PREDICTABLY at the very first line that ' +
      'dereferences it — a <code>NullReferenceException</code> pointing directly at the call site, with an ' +
      'obvious, well-understood cause any developer recognizes instantly.',
      'A Null Object that throws <code>NotImplementedException</code> on only SOME of its methods instead ' +
      'behaves correctly (silently, safely) for every OTHER method call — meaning code using it can run ' +
      'successfully for a long time, through many different code paths, before it happens to reach the ONE ' +
      'method that was never actually implemented. The failure, when it finally arrives, is deep inside ' +
      'unrelated business logic, far from wherever the Null Object was originally chosen — genuinely harder ' +
      'to trace back to its actual cause than an immediate, obvious null-dereference would have been.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Broken vs Correct NullPaymentGateway',
    language: 'csharp',
    code: `public interface IPaymentGateway
{
    PaymentResult Charge(decimal amount);
    PaymentResult Refund(string transactionId, decimal amount);
    TransactionHistory GetHistory(string customerId);
}

// BROKEN — violates LSP. Two of three methods are genuine no-ops,
// but the third throws instead of providing a safe default.
public sealed class BrokenNullPaymentGateway : IPaymentGateway
{
    public PaymentResult Charge(decimal amount) => PaymentResult.Skipped();
    public PaymentResult Refund(string transactionId, decimal amount) => PaymentResult.Skipped();

    public TransactionHistory GetHistory(string customerId) =>
        throw new NotImplementedException("NullPaymentGateway has no history to report");
        // Compiles fine. Charge() and Refund() work perfectly in every
        // test that never happens to call GetHistory(). The failure
        // only appears the FIRST time some unrelated code path — a
        // billing dashboard, an audit report, written months later by
        // someone who has never seen this class — calls GetHistory()
        // on what looks like an entirely ordinary IPaymentGateway.

// CORRECT — every method has a genuinely safe, no-op-equivalent
// implementation, exactly like the main page's own NullLogger.
public sealed class NullPaymentGateway : IPaymentGateway
{
    public static readonly NullPaymentGateway Instance = new();
    private NullPaymentGateway() { }

    public PaymentResult Charge(decimal amount) => PaymentResult.Skipped();
    public PaymentResult Refund(string transactionId, decimal amount) => PaymentResult.Skipped();
    public TransactionHistory GetHistory(string customerId) => TransactionHistory.Empty;
    // Empty history is a genuinely safe answer: "no transactions
    // happened," which is literally true for a gateway that never
    // actually processes anything.
}

// Both compile. Both satisfy IPaymentGateway. Only one is SAFE to
// actually substitute anywhere an IPaymentGateway is expected —
// exactly what the Liskov Substitution Principle requires.
IPaymentGateway gateway = testModeEnabled
    ? NullPaymentGateway.Instance
    : new StripePaymentGateway(apiKey);

gateway.Charge(49.99m);           // fine either way
var history = gateway.GetHistory(customerId); // fine for NullPaymentGateway.Instance,
                                               // throws for BrokenNullPaymentGateway`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own FIRST mistake block already warns against a Null Object that "silently succeeds" ' +
    'for payments (<code>NullPaymentGateway.Charge() => PaymentResult.Success()</code>). This subtopic\'s own ' +
    '<code>NullPaymentGateway.Charge()</code> instead returns <code>PaymentResult.Skipped()</code> — a ' +
    'DIFFERENT status than either Success or a thrown exception. Why does this distinction matter?',
  hint:
    'Think about what a CALLER checking the returned <code>PaymentResult</code> can actually tell apart — ' +
    'compare "Success," "Skipped," and an exception as three different signals.',
  solution:
    'A "Success" result is genuinely misleading — it tells the caller a real charge happened when none did, ' +
    'exactly the silent-failure risk the main page\'s own first mistake block warns against. An exception is ' +
    'the OTHER extreme this subtopic itself warns against — it makes the method fail loudly for every caller, ' +
    'even ones that would have been fine treating "no payment gateway configured" as an expected, benign ' +
    'state. "Skipped" is a genuinely distinct third signal: a caller that cares CAN check for it and branch ' +
    'accordingly (e.g. logging "payment skipped — test mode"), while a caller that does not care can still ' +
    'treat it as safely as it would treat "Success," since nothing throws and no exception needs to be ' +
    'caught. This is the same LSP-safety property GetHistory()\'s empty result has — a value that is safe by ' +
    'DEFAULT, not one that merely avoids crashing.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since BrokenNullPaymentGateway compiles fine and passes every test that happens to be written ' +
      'against it, the LSP violation is really more of a style nitpick than a genuine correctness problem.',
    reality:
      'It is a genuine correctness problem specifically BECAUSE it compiles and passes existing tests — that ' +
      'is exactly what makes it dangerous. A test suite proves the code is correct for the SCENARIOS IT ' +
      'COVERS; a class silently violating its own interface contract on an untested method path is a bug ' +
      'waiting for the first caller (production or otherwise) that happens to exercise that specific path, ' +
      'which is precisely the "worse than a null check" claim the main page\'s own QnA makes.',
  },
  {
    thought: 'The fix here is specific to payment gateways — for a less critical interface, throwing on an ' +
      'unimplemented method inside a Null Object would be a reasonable shortcut.',
    reality:
      'The main page\'s own QnA states the LSP rule in fully general terms, with no carve-out based on how ' +
      'critical the interface is: "A Null Object must be a valid substitution for the real object... If ' +
      'satisfying LSP is impossible... Null Object is the wrong pattern." The fix here (a genuinely safe ' +
      'default for every method) is the general discipline Null Object requires everywhere it is used — the ' +
      'payment example is just a vivid, high-stakes illustration of a rule that applies just as much to a ' +
      'lower-stakes interface, where the same shortcut would eventually cause the same category of surprise.',
  },
];

@Component({
  selector: 'app-null-object-when-a-null-object-violates-liskov-substitution',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './when-a-null-object-violates-liskov-substitution.html',
  styleUrl: './when-a-null-object-violates-liskov-substitution.scss',
})
export class WhenANullObjectViolatesLiskovSubstitutionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
