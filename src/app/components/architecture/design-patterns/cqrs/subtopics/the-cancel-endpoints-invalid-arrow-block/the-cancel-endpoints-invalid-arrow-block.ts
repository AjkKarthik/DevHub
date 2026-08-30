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
    heading: 'A Real, Reproducible C# Compile Error',
    points: [
      'The main page\'s own "Commands & Queries (MediatR)" codeTab wrote the Cancel controller action as <code>public async Task&lt;IActionResult&gt; Cancel(Guid id, [FromBody] string reason) =&gt;</code> followed by a <code>{ ... }</code> block body — that combination does not compile.',
      'The <code>=&gt;</code> token is C#\'s expression-bodied member syntax — it must be followed by a SINGLE EXPRESSION, never a block statement. A block body (<code>{ ... }</code>, with any number of statements ending in a <code>;</code>) requires a plain method signature with no <code>=&gt;</code> at all.',
      'This is the exact opposite mistake from leaving off a needed <code>=&gt;</code> — here an unnecessary one was added in front of a body that was never expression-shaped to begin with, since it has two statements (an <code>await</code> call and a <code>return</code>).',
      'The fix is simply removing the <code>=&gt;</code>: <code>public async Task&lt;IActionResult&gt; Cancel(...) { await ...; return NoContent(); }</code> — the exact same block body, now attached to a signature that actually accepts one.',
    ],
  },
  {
    heading: 'Why the Other Three Actions on the Same Controller Were Fine',
    points: [
      'The SAME codeTab\'s <code>Place</code>, <code>Get</code>, and (once fixed) the corrected <code>Cancel</code> actions are a useful side-by-side contrast: <code>Place</code> and <code>Get</code> both compile as one-line <code>=&gt; Ok(await mediator.Send(...))</code> expression bodies — a single expression, no <code>{ }</code>, no problem.',
      'Only <code>Cancel</code> needed two separate statements (send the command, then return a DIFFERENT result — <code>NoContent()</code>, not the mediator\'s own return value), which is precisely the shape a block body exists for.',
      'A good rule of thumb: if writing the method body naturally uses a semicolon to separate two statements, it needs a block <code>{ }</code>, not <code>=&gt;</code>. If the whole body is one expression whose value IS the return value, <code>=&gt;</code> is shorter and equally correct.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Invalid',
    language: 'csharp',
    code: `[HttpDelete("{id}")]
public async Task<IActionResult> Cancel(Guid id, [FromBody] string reason) =>
{
    // A parser error: "=>" expects one expression, not a block.
    // This method does not compile at all.
    await mediator.Send(new CancelOrderCommand(id, reason));
    return NoContent();
}`,
  },
  {
    label: 'After — Valid',
    language: 'csharp',
    code: `[HttpDelete("{id}")]
public async Task<IActionResult> Cancel(Guid id, [FromBody] string reason)
{
    // Plain method signature — no "=>" — so a multi-statement
    // block body is exactly what C# expects here.
    await mediator.Send(new CancelOrderCommand(id, reason));
    return NoContent();
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s <code>Place</code> action reads <code>public async Task&lt;IActionResult&gt; Place(PlaceOrderCommand cmd) =&gt; Ok(await mediator.Send(cmd));</code>. Suppose a new requirement means it must ALSO log the created order ID before returning. Which change is needed: keep <code>=&gt;</code> and just add a second statement before the <code>Ok(...)</code> expression, or drop <code>=&gt;</code> for a block body?',
  hint: 'Ask: after the change, is the method body still exactly one expression whose value is returned, or does it now need two separate statements (log, then return)?',
  solution: `// Drop "=>" — logging is a separate statement from the return,
// so this now needs a block body, the same fix Cancel needed:
public async Task<IActionResult> Place(PlaceOrderCommand cmd)
{
    var id = await mediator.Send(cmd);
    logger.LogInformation("Order {OrderId} placed", id);
    return Ok(id);
}`,
};

const misconceptions: Misconception[] = [
  {
    thought: '"<code>=&gt;</code> just means \'the method body starts here\' — it works the same as <code>{ }</code>, just shorter."',
    reality: 'They are not interchangeable. <code>=&gt;</code> (expression-bodied member syntax) requires exactly one expression and produces no <code>{ }</code> at all — the compiler generates the return/void-call itself. A block body needs its own explicit <code>return</code> statement (or none, for a <code>void</code>/<code>Task</code> method) and can contain any number of statements. Writing both together, as the original Cancel action did, is invalid syntax, not merely unusual style.',
  },
  {
    thought: 'A method that does two things (send a command, then return a fixed result) can still use <code>=&gt;</code> if you chain them with a comma or semicolon inside the arrow.',
    reality: 'C# has no comma-operator or multi-statement form for an expression body — the expression after <code>=&gt;</code> must be a single expression tree with one resulting value. Two sequential actions (a statement, then another statement) is definitionally a block\'s job. The compiler error the original code would have produced points at the unexpected <code>{</code> right after <code>=&gt;</code>, since the parser is still expecting an expression there.',
  },
  {
    thought: 'This kind of syntax mistake would definitely show up as a build failure, so it is a low-severity issue to catch.',
    reality: 'It IS a build failure — a real CS-series compiler error — which is exactly why it is worth tracing precisely: unlike a subtler logic bug that silently produces a wrong answer, this class of mistake stops the whole project from compiling. The main lesson is not "this bug is scary" but "this exact error shape (an unexpected <code>{</code> right after <code>=&gt;</code>) always means the same thing: an expression body was combined with a block."',
  },
];

@Component({
  selector: 'app-dp-cqrs-cancel-arrow-block',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-cancel-endpoints-invalid-arrow-block.html',
  styleUrl: './the-cancel-endpoints-invalid-arrow-block.scss',
})
export class TheCancelEndpointsInvalidArrowBlockSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
