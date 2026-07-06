import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-multi-handler-or-semantics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-multi-handler-or-semantics-fail-veto.html',
  styleUrl: './testing-multi-handler-or-semantics-fail-veto.scss',
})
export class TestingMultiHandlerOrSemanticsFailVetoSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the OR/veto rule as fact — "succeeds if ANY handler succeeds and none fails" — but never shows how to actually prove it, and the three-handler case (two Succeed, one Fail) is where intuition breaks down',
      points: [
        'You do not need an HTTP server, a test client, or even DI to test this — <code>AuthorizationHandlerContext</code> is a plain constructible object. Build one with a requirement, a <code>ClaimsPrincipal</code>, and (optionally) a resource; call <code>HandleRequirementAsync(context, requirement)</code> directly on each handler instance; then assert on <code>context.HasSucceeded</code> / <code>context.HasFailed</code>. This is exactly the technique the main page\'s own Q&A mentions in passing — this subtopic shows the full test and, critically, the case that trips people up.',
        '<strong>The trap</strong>: "OR semantics" makes people assume the FIRST handler to call <code>Succeed()</code> ends evaluation early, like a short-circuiting <code>||</code>. It does not. <strong>Every registered handler for a requirement always runs</strong> (the framework does not stop early on Succeed), and the requirement is satisfied only when the AGGREGATE result, after all handlers have run, has at least one Succeed and zero Fails. A handler that calls <code>Fail()</code> AFTER another handler already called <code>Succeed()</code> still vetoes the whole requirement — order of registration does not create precedence.',
      ],
    },
    {
      heading: 'Fail() is requirement-scoped, not handler-scoped — a Fail() from a handler for Requirement A does not affect Requirement B, but multiple handlers CAN register for the same requirement type and all of them count toward that one requirement\'s Fail/Succeed aggregate',
      points: [
        'A policy can have multiple DIFFERENT requirements (added via multiple <code>AddRequirements()</code> calls or <code>RequireClaim</code> + <code>AddRequirements</code> combined) — those combine with AND semantics: the policy succeeds only if ALL its requirements succeed. It is only WITHIN a single requirement type, when MULTIPLE handlers are registered for that same type, that the OR/veto rule applies. Conflating "multiple requirements on a policy" (AND) with "multiple handlers for one requirement" (OR-with-veto) is the single most common source of wrong predictions when reasoning about a policy\'s outcome by eye instead of testing it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Constructing AuthorizationHandlerContext directly — no server needed',
      language: 'csharp',
      code: `public class SucceedHandler : AuthorizationHandler<TestRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, TestRequirement req)
    {
        context.Succeed(req);
        return Task.CompletedTask;
    }
}

public class FailHandler : AuthorizationHandler<TestRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, TestRequirement req)
    {
        context.Fail();
        return Task.CompletedTask;
    }
}

public class NoOpinionHandler : AuthorizationHandler<TestRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, TestRequirement req)
    {
        // Neither Succeed nor Fail — "abstains"
        return Task.CompletedTask;
    }
}

public record TestRequirement : IAuthorizationRequirement;

// Helper: build a context the same shape the framework builds internally
static AuthorizationHandlerContext MakeContext(
    IAuthorizationRequirement req, object? resource = null)
{
    var user = new ClaimsPrincipal(new ClaimsIdentity("TestAuth"));
    return new AuthorizationHandlerContext(new[] { req }, user, resource);
}`,
    },
    {
      label: 'The test that disproves "first Succeed wins" — every handler runs, Fail always vetoes',
      language: 'csharp',
      code: `[Fact]
public async Task Succeed_Then_Fail_Registered_After_Still_Vetoes()
{
    var requirement = new TestRequirement();
    var context = MakeContext(requirement);

    // Simulates DI resolving handlers in THIS registration order:
    // services.AddSingleton<IAuthorizationHandler, SucceedHandler>();
    // services.AddSingleton<IAuthorizationHandler, FailHandler>();
    var handlers = new IAuthorizationHandler[]
    {
        new SucceedHandler(),   // runs first, calls context.Succeed(requirement)
        new FailHandler(),      // runs second, calls context.Fail()
    };

    foreach (var handler in handlers)
        await handler.HandleAsync(context);

    // Intuition says: "SucceedHandler already succeeded, so we're done" — WRONG.
    Assert.True(context.HasFailed);      // Fail() always wins, regardless of order
    Assert.False(context.HasSucceeded);  // HasSucceeded reflects the FINAL aggregate

    // Reversing registration order changes NOTHING — Fail() is unconditional:
    var context2 = MakeContext(requirement);
    var reversed = new IAuthorizationHandler[]
    {
        new FailHandler(),
        new SucceedHandler(),
    };
    foreach (var handler in reversed)
        await handler.HandleAsync(context2);

    Assert.True(context2.HasFailed);     // same result — order is irrelevant
}

[Fact]
public async Task Two_NoOpinion_Handlers_Leave_Requirement_Unsatisfied()
{
    // The real-world case people forget: if EVERY handler abstains
    // (neither Succeed nor Fail — e.g. a claim was simply absent),
    // the requirement is NOT satisfied. "No opinion" defaults to deny,
    // not allow — there is no implicit Succeed if nobody objects.
    var requirement = new TestRequirement();
    var context = MakeContext(requirement);

    foreach (var handler in new IAuthorizationHandler[]
             { new NoOpinionHandler(), new NoOpinionHandler() })
        await handler.HandleAsync(context);

    Assert.False(context.HasSucceeded);
    Assert.False(context.HasFailed);
    // AuthorizationResult.Succeeded (the caller-facing result) is FALSE here —
    // PendingRequirements still contains the unsatisfied requirement.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A policy has three handlers registered for the same requirement: HandlerA calls context.Succeed(requirement) synchronously; HandlerB does nothing (abstains); HandlerC also calls context.Succeed(requirement). Predict context.HasSucceeded after all three run — then predict what changes if a fourth handler, HandlerD, is added that calls context.Fail(), regardless of where in the registration list HandlerD sits.',
    hint: 'HasSucceeded/HasFailed are computed over the ENTIRE run, not handler-by-handler. Does one Fail() anywhere in the list change the answer regardless of position?',
    solution: `With only HandlerA, HandlerB, HandlerC: context.HasSucceeded is TRUE.
Two Succeed() calls and one abstention aggregate to "at least one
Succeed, zero Fails" — the requirement is satisfied. HandlerB's
abstention contributes nothing either way; it neither helps nor hurts.

Adding HandlerD (Fail()) ANYWHERE in the list — first, last, or in the
middle — flips the aggregate: context.HasFailed becomes TRUE and
HasSucceeded becomes FALSE, no matter how many other handlers already
called Succeed(). This is the core lesson: Succeed() records "at least
one vote of confidence," but Fail() is a permanent, order-independent
veto over the ENTIRE requirement — the aggregate is computed once
every handler has run, not incrementally as each one executes. There
is no code path where a Succeed() call, however many handlers already
made it, can undo a Fail() from a handler that runs later.

This is exactly why context.Fail() is reserved for hard denials (a
banned user, a revoked token) rather than routine "this handler's
condition wasn't met" — using Fail() for the latter accidentally vetoes
every OTHER handler's Succeed() for that same requirement, even ones
that would otherwise have granted legitimate access.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'multiple handlers for one requirement behave like a short-circuiting || — the moment one handler calls Succeed(), evaluation stops and later handlers never run.',
      reality: 'every registered handler for a requirement always runs to completion; the requirement is satisfied only by the AGGREGATE result computed after all handlers finish — at least one Succeed() and zero Fail() calls, regardless of which handler ran first.',
    },
    {
      thought: 'if no handler calls Fail(), the requirement passes by default — "nobody objected" is treated the same as an explicit approval.',
      reality: 'a requirement where every handler abstains (calls neither Succeed nor Fail) is NOT satisfied — HasSucceeded stays false and the requirement remains pending; "no opinion" defaults to deny, there is no implicit grant.',
    },
    {
      thought: 'testing custom authorization handlers requires spinning up a WebApplicationFactory or a real HTTP request pipeline.',
      reality: 'AuthorizationHandlerContext is a plain constructible object — build one with a requirement, a ClaimsPrincipal, and an optional resource, then call HandleRequirementAsync directly on the handler instance and assert on context.HasSucceeded/HasFailed, no server involved.',
    },
  ];
}
