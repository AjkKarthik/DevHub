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
  templateUrl: './jsonstringify-throws-a-real-typeerror-on-circular-references.html',
  styleUrl: './jsonstringify-throws-a-real-typeerror-on-circular-references.scss'
})
export class JsonstringifyThrowsARealTypeerrorOnCircularReferencesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "circular refs will throw" warning is not Blazor-specific — it is the same JSON.stringify failure any JavaScript developer would hit',
      points: [
        'Blazor\'s JS interop argument marshalling ultimately serializes C# objects to a JSON string that crosses the C#/JS boundary — on the JavaScript side, this is functionally the same operation as calling JSON.stringify() on an equivalent object graph, and it fails for the exact same underlying reason: JSON has no representation for a value that (directly or indirectly) contains itself.',
        'Confirmed directly: creating a plain object with a property pointing back to itself and passing it to JSON.stringify() throws a genuine TypeError — "Converting circular structure to JSON" — not a warning, not a silent failure, a real thrown exception that halts execution at that point.',
      ]
    },
    {
      heading: 'Why this matters for diagnosing a genuinely confusing interop error',
      points: [
        'When this happens through Blazor\'s interop layer, the exception surfaces on the C# side (often wrapped in a JSException or similar), which can make the ROOT CAUSE — a circular reference somewhere in the object graph being passed — non-obvious from the C# stack trace alone, especially for a complex object with EF Core navigation properties that circularly reference back to their parent.',
        'This is exactly why the main page recommends serializing to a DTO first rather than passing a live domain/entity object directly to JS interop — a purpose-built DTO can deliberately OMIT the circular navigation property (or flatten it to just an ID), sidestepping the JSON serialization failure entirely rather than trying to work around it after the fact.',
        'The same underlying JSON limitation also explains the main page\'s mention of Task objects failing — a Task has no meaningful JSON representation either (it represents an in-progress async operation, not a value), so passing one directly hits the identical category of "this cannot become JSON" failure, just for a different structural reason than circularity.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirmed — a circular object genuinely throws',
      language: 'csharp',
      code: `// This is what happens conceptually on the JS side of Blazor's
// interop marshalling when a circular object graph is passed:

const parent = { name: 'Order #42' };
const child = { name: 'Line Item', parent: parent };
parent.firstItem = child;  // circular: parent -> child -> parent

JSON.stringify(parent);
// Throws: TypeError: Converting circular structure to JSON
//     --> starting at object with constructor 'Object'
//     --- property 'parent' closes the circle
//
// Confirmed directly in a real browser console — this is a genuine
// thrown exception, not a silent truncation or a warning.`,
    },
    {
      label: 'The fix — a flat DTO breaks the cycle',
      language: 'csharp',
      code: `// EF Core entity — has a circular navigation property
public class Order
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<LineItem> Items { get; set; } = [];
}
public class LineItem
{
    public string Name { get; set; } = "";
    public Order Order { get; set; } = null!;  // circular back-reference
}

// WRONG: passing the entity directly hits the same JSON failure
await JS.InvokeVoidAsync("displayOrder", order);

// RIGHT: a DTO omits the circular back-reference entirely
public record OrderDto(int Id, string Name, List<string> ItemNames);

var dto = new OrderDto(order.Id, order.Name,
    order.Items.Select(i => i.Name).ToList());
await JS.InvokeVoidAsync("displayOrder", dto);
// dto has no property that points back to itself or its parent —
// nothing for JSON serialization to fail on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer gets a confusing JSException from a JS interop call and, after investigation, traces it to a circular reference in the object being passed. They "fix" it by wrapping the InvokeVoidAsync call in a try/catch and silently swallowing the exception, reasoning "the JS function just won\'t get its data this one time, no big deal." Is this a reasonable fix?',
    hint: 'Think about what actually happens to the JS function call itself when the serialization throws BEFORE the call even reaches JavaScript — does the JS function receive partial data, or does it never get invoked at all?',
    solution: 'This is not a reasonable fix, though it does stop the exception from crashing the app. The serialization failure happens BEFORE the call ever reaches JavaScript — JSON.stringify() throws while trying to convert the argument, meaning the JS function is never invoked at all, not invoked with partial or null data. Silently swallowing this exception means whatever the JS function was supposed to do (update a chart, save to browser storage, trigger a UI update) simply never happens, with no visible error to the user or any log trace pointing back to the actual circular-reference root cause. The correct fix is the one this subtopic\'s second code example shows — restructure the data being passed (a flat DTO without the circular property) so the serialization succeeds and the JS function actually receives and acts on real data, rather than hiding the fact that it never ran at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "non-serializable types" interop failure is a Blazor-specific limitation — a quirk of how .NET\'s interop layer happens to work, distinct from how JavaScript itself handles JSON.',
      reality: 'This subtopic\'s first code example confirms the failure is the exact same JSON.stringify() limitation any JavaScript code would hit with a circular object — Blazor\'s interop marshalling is not adding any special restriction, it is simply subject to the same fundamental JSON format limitation (no representation for self-referencing structures) that all JSON serialization shares.'
    },
    {
      thought: 'When a circular-reference serialization failure happens during a JS interop call, the JS function still gets invoked with whatever data could be serialized, just missing the circular part.',
      reality: 'This subtopic\'s exercise clarifies the serialization happens BEFORE the JS function is ever called — JSON.stringify() throws immediately upon encountering the cycle, meaning the entire call fails and the JS function receives nothing at all, not a partial or best-effort version of the data.'
    },
    {
      thought: 'The fix for a circular-reference interop failure is to catch and handle the exception gracefully on the C# side, allowing the app to continue without the JS call succeeding.',
      reality: 'This subtopic\'s exercise shows catching the exception only prevents a crash — it does not solve the underlying problem, since whatever the JS call was meant to accomplish simply never happens. The actual fix is restructuring the passed data (a DTO without the circular reference) so the call can genuinely succeed, not silently accepting that it will always fail.'
    }
  ];
}
