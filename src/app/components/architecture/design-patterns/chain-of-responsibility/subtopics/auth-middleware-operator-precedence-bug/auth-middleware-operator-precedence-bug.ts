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
    heading: 'A One-Character Precedence Bug That Fails Open',
    points: [
      'The main page\'s original "Auth middleware" codeTab checked ' +
      '<code>if (!context.User.Identity?.IsAuthenticated ?? false)</code> — a genuinely broken auth check ' +
      'that lets ANONYMOUS requests through as if they were authenticated, exactly the failure mode a chain ' +
      '(and a security check) must never have.',
      'The root cause is C# operator precedence: unary <code>!</code> (logical NOT) binds TIGHTER than binary ' +
      '<code>??</code> (null-coalescing). The expression as written parses as ' +
      '<code>(!context.User.Identity?.IsAuthenticated) ?? false</code>, not the intended ' +
      '<code>!(context.User.Identity?.IsAuthenticated ?? false)</code>.',
    ],
  },
  {
    heading: 'Tracing Every Case Through the Buggy Expression',
    points: [
      'When <code>Identity</code> is null (a genuinely unauthenticated/anonymous request — the MOST common ' +
      'case this check exists to catch): <code>context.User.Identity?.IsAuthenticated</code> short-circuits to ' +
      'null via the null-conditional operator. <code>!null</code> (the lifted <code>bool?</code> NOT operator) ' +
      'is also null. <code>null ?? false</code> evaluates to <code>false</code> — so the <code>if</code> ' +
      'condition is FALSE, and the middleware calls <code>next(context)</code>, letting the anonymous request ' +
      'straight through.',
      'When <code>IsAuthenticated</code> is genuinely <code>true</code>: <code>!true</code> is <code>false</code>, ' +
      '<code>false ?? false</code> is <code>false</code> — condition is FALSE, correctly proceeds. This case ' +
      'happens to work, which is exactly why the bug is easy to miss in casual testing with a real logged-in ' +
      'user.',
      'When <code>IsAuthenticated</code> is explicitly <code>false</code> (an Identity object exists but is ' +
      'not authenticated): <code>!false</code> is <code>true</code>, <code>true ?? false</code> is ' +
      '<code>true</code> — condition is TRUE, correctly returns 401. This case ALSO happens to work.',
      'Only the null-Identity case — the plain "no user at all" anonymous request — silently bypasses the ' +
      'check, which is precisely why a quick manual test with an authenticated user AND a "logged out with a ' +
      'stale but present Identity" user could both pass while a genuinely anonymous request slips through.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before / After',
    language: 'csharp',
    code: `// BEFORE — fails open for anonymous requests (Identity is null).
// Operator precedence: ! binds tighter than ??, so this parses as
// (!context.User.Identity?.IsAuthenticated) ?? false, NOT
// !(context.User.Identity?.IsAuthenticated ?? false).
app.Use(async (context, next) =>
{
    if (!context.User.Identity?.IsAuthenticated ?? false)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized");
        return;
    }
    await next(context); // reached even when Identity is null!
});

// AFTER — != true treats BOTH null and false as "not authenticated,"
// with no precedence ambiguity to trip over.
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized");
        return;
    }
    await next(context);
});`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Rewrite the buggy condition using explicit parentheses only (no change to <code>!</code> or ' +
    '<code>??</code>) so it correctly matches the intended meaning, WITHOUT switching to the ' +
    '<code>!= true</code> form shown in the fix. Then explain why <code>!= true</code> is still the better ' +
    'choice in real code.',
  hint:
    'The intended logic is "NOT (definitely authenticated)" — where does the closing parenthesis around the ' +
    'null-coalescing expression need to go before the negation is applied?',
  solution:
    'The parenthesized fix is <code>if (!(context.User.Identity?.IsAuthenticated ?? false))</code> — wrapping ' +
    'the null-coalescing expression first so it evaluates to a definite <code>bool</code> (true or false, ' +
    'never null), and only THEN applying <code>!</code> to that definite value. This produces the correct ' +
    'result for all three cases. <code>!= true</code> is still the better real-world choice because it reads ' +
    'as a single, unambiguous comparison with no operator-precedence trap to get wrong in the first place — ' +
    'it does not rely on a reader correctly recalling that <code>!</code> binds tighter than <code>??</code>, ' +
    'the exact fact whose absence created this bug.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>!x?.y ?? false</code> "reads" like "if NOT authenticated, or unknown, default to ' +
      'false," the code must do what it looks like it does.',
    reality:
      'How an expression READS in English and how the COMPILER actually groups its operators are two separate ' +
      'things — C#\'s operator precedence table is the only authority on what an expression actually ' +
      'evaluates to, and <code>!</code> binding tighter than <code>??</code> here produces a result that ' +
      'directly contradicts the natural-language reading most developers would give it.',
  },
  {
    thought: 'A bug like this would be caught immediately by any reasonable manual testing.',
    reality:
      'This specific bug is unusually easy to miss precisely because TWO of the three possible cases (a ' +
      'genuinely authenticated user, and a user with an explicitly-false IsAuthenticated) behave correctly — ' +
      'only the THIRD case (no Identity at all, i.e. a plain anonymous request with no auth attempt) slips ' +
      'through, which is a scenario a developer testing "does login work" and "does an expired token get ' +
      'rejected" might never think to test separately.',
  },
  {
    thought: 'This is a purely academic C# trivia point, not something that matters in a real codebase.',
    reality:
      'This is a genuine security bug with a real consequence: any endpoint behind this exact middleware ' +
      'pattern would accept completely unauthenticated requests as if they were logged in, for the single most ' +
      'common anonymous-request shape there is — precisely the class of bug security code reviews exist to ' +
      'catch.',
  },
];

@Component({
  selector: 'app-cor-auth-middleware-operator-precedence-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './auth-middleware-operator-precedence-bug.html',
  styleUrl: './auth-middleware-operator-precedence-bug.scss',
})
export class AuthMiddlewareOperatorPrecedenceBugSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
