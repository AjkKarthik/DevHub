import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-railway-pipelines-asserting-which-step-failed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-railway-pipelines-asserting-which-step-failed.html',
  styleUrl: './testing-railway-pipelines-asserting-which-step-failed.scss',
})
export class TestingRailwayPipelinesAssertingWhichStepFailedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ProcessOrder/RegistrationService pipelines are demonstrated, but never tested for the specific claim that matters most: short-circuiting',
      points: [
        'The main Functional C# page\'s own <code>ProcessOrder</code> and <code>RegistrationService.Register</code> pipelines chain <code>Bind</code> calls specifically so that a failure at any step skips ALL later steps. This is a genuinely different, and more valuable, claim to test than just "the pipeline returns a Result" — the real value of Railway-Oriented Programming is that failing FAST prevents wasted work (an inventory check that never runs after validation already failed, a payment charge that never happens after inventory failed).',
      ],
    },
    {
      heading: 'A call-count spy on each step proves later steps were genuinely skipped, not just that the final Result looks like a failure',
      points: [
        'The technique: wrap each pipeline step in a small counter (or use a mocking library\'s call-count assertion) and verify that when step 1 fails, steps 2, 3, and 4 were NEVER INVOKED at all — not merely that the final Result\'s <code>.IsFailed</code> is true. A Result showing failure could, in principle, come from ANY step along the chain; only a call-count assertion proves it came from the RIGHT step, and that the chain genuinely stopped there rather than continuing to run (and discarding) subsequent steps.',
        'This directly matters for the main page\'s own <code>CheckInventory</code>/<code>ChargePayment</code> example — a bug that accidentally calls <code>ChargePayment</code> even after <code>CheckInventory</code> failed (e.g. from a broken <code>Bind</code> implementation, or a manual if-check replacing <code>Bind</code> incorrectly) could silently charge a customer for an order that was never actually going to be fulfilled — exactly the kind of bug a "final Result looks right" test would miss entirely.',
      ],
    },
    {
      heading: 'Testing WHICH specific error came through, not just that some error exists',
      points: [
        'A weak test asserts only <code>result.IsFailed</code> is true. A meaningful test asserts on the SPECIFIC error message or typed error object, confirming the pipeline failed at the EXPECTED step for the EXPECTED reason — e.g. that an invalid email produces the validation error, not accidentally the duplicate-email error, which would indicate the steps are running in the wrong order or a step is misconfigured.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving later steps are genuinely SKIPPED — not just that the final Result is a failure',
      language: 'csharp',
      code: `using Xunit;

public class ProcessOrderShortCircuitTests
{
    [Fact]
    public void ValidationFailure_NeverCallsInventoryOrPayment()
    {
        int inventoryCallCount = 0;
        int paymentCallCount   = 0;

        Result<ValidatedDto> Validate(CreateOrderDto dto) =>
            Result<ValidatedDto>.Failure("Order must have at least one item.");

        Result<ReservedItems> CheckInventory(ValidatedDto dto)
        {
            inventoryCallCount++;   // should NEVER increment in this test
            return Result<ReservedItems>.Success(new ReservedItems());
        }

        Result<PaymentResult> ChargePayment(ReservedItems items)
        {
            paymentCallCount++;    // should NEVER increment in this test
            return Result<PaymentResult>.Success(new PaymentResult());
        }

        var result = Validate(new CreateOrderDto(new List<OrderItem>(), null))
            .Bind(CheckInventory)
            .Bind(ChargePayment);

        Assert.True(result.IsFailed);

        // The DECISIVE assertions — these are what actually prove
        // short-circuiting worked, not just that the final Result
        // "looks like" a failure:
        Assert.Equal(0, inventoryCallCount);
        Assert.Equal(0, paymentCallCount);
    }
}`,
    },
    {
      label: 'Testing which SPECIFIC error surfaced, to confirm the right step failed',
      language: 'csharp',
      code: `public class RegistrationPipelineTests
{
    [Fact]
    public void InvalidEmail_FailsAtValidation_NotDuplicateCheck()
    {
        var svc = new RegistrationService();

        // "taken@example.com" is BOTH an invalid-looking test AND a
        // duplicate — this deliberately tests which check fires FIRST:
        var result = svc.Register(new RegisterDto("Bob", "not-an-email", "securepass123"));

        Assert.True(result.IsFailed);

        // Asserting on the SPECIFIC message confirms validation (not
        // the duplicate-email check) is what actually failed — a
        // weaker "just check IsFailed" test would pass even if the
        // steps were silently reordered or a check were broken:
        Assert.Equal("Email must contain '@'.", result.Error);
    }

    [Fact]
    public void ValidEmailButDuplicate_FailsAtDuplicateCheck_NotValidation()
    {
        var svc = new RegistrationService();

        var result = svc.Register(new RegisterDto("Bob", "taken@example.com", "securepass123"));

        Assert.True(result.IsFailed);
        Assert.Equal("'taken@example.com' is already registered.", result.Error);
        // Confirms this input passes validation FIRST, then correctly
        // fails at the duplicate-check step — not the other way around.
    }
}`,
    },
    {
      label: 'A reusable spy wrapper for any Bind step in a pipeline',
      language: 'csharp',
      code: `public static class BindSpy
{
    // Wraps any pipeline step function, tracking exactly how many
    // times it was actually invoked — reusable across any Result<T>
    // pipeline under test:
    public static (Func<T, Result<U>> Wrapped, Func<int> CallCount) Track<T, U>(
        Func<T, Result<U>> step)
    {
        int count = 0;
        Func<T, Result<U>> wrapped = input =>
        {
            count++;
            return step(input);
        };
        return (wrapped, () => count);
    }
}

public class SpyBasedPipelineTests
{
    [Fact]
    public void FailureAtFirstStep_SkipsAllLaterSteps_UsingSpyHelper()
    {
        var (trackedInventory, inventoryCalls) =
            BindSpy.Track<ValidatedDto, ReservedItems>(dto =>
                Result<ReservedItems>.Success(new ReservedItems()));

        var result = Result<ValidatedDto>.Failure("bad input")
            .Bind(trackedInventory);

        Assert.True(result.IsFailed);
        Assert.Equal(0, inventoryCalls()); // proves the step was skipped
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for the main topic page\'s own <code>RegistrationService.Register</code> pipeline (Validate → CheckDuplicate → HashPassword → CreateUser) proving that when validation fails, <code>CheckDuplicate</code> never runs — even though the test input happens to ALSO use an email that would fail the duplicate check.',
    hint: 'Use an input with BOTH an invalid field (e.g. empty name) AND a duplicate email, then assert the returned error is the validation error, not the duplicate-email error — this proves the pipeline stopped at validation before ever reaching the duplicate check.',
    solution: `[Fact]
public void EmptyNameAndDuplicateEmail_FailsAtValidation_NeverReachesDuplicateCheck()
{
    var svc = new RegistrationService();

    // Deliberately using BOTH an invalid name (empty) AND an email
    // that WOULD fail the duplicate check ("taken@example.com") —
    // this specifically tests which failure surfaces first:
    var result = svc.Register(new RegisterDto("", "taken@example.com", "securepass123"));

    Assert.True(result.IsFailed);

    // If this shows the VALIDATION error (not the duplicate-email
    // error), it proves CheckDuplicate never ran — the pipeline
    // genuinely stopped at the first failing step, exactly as
    // Railway-Oriented Programming is supposed to guarantee:
    Assert.Equal("Name is required.", result.Error);

    // A test asserting ONLY "result.IsFailed" would pass even if the
    // steps ran in the WRONG order, or even if CheckDuplicate ran
    // redundantly after validation already failed — only asserting
    // on the SPECIFIC error message proves the short-circuit actually
    // stopped the chain at the right place.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test asserting result.IsFailed on a Bind chain proves that later steps in the chain were correctly skipped.',
      reality: 'IsFailed only tells you the FINAL Result is a failure — it says nothing about whether later steps were actually invoked and discarded, or genuinely never called. A call-count spy on each step is what proves short-circuiting actually happened.',
    },
    {
      thought: 'testing a Result-returning pipeline only requires confirming the correct final success or failure outcome.',
      reality: 'a meaningful test also confirms the SPECIFIC error came from the EXPECTED step — using an input that could fail at multiple steps and asserting on the specific error message reveals whether steps are running in the right order.',
    },
    {
      thought: 'a bug that accidentally calls a later pipeline step (like charging payment) even after an earlier step failed would be caught by any reasonable test of the final Result.',
      reality: 'the final Result can still show a failure even if a later step was WRONGLY invoked and its side effects (like a real payment charge) already happened — only an explicit call-count assertion on that specific step catches this class of bug.',
    },
  ];
}
