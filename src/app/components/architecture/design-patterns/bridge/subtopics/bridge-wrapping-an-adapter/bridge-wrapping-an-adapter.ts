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
    heading: 'A Combination the Main Page Only Describes',
    points: [
      'The main page\'s own QnA states: "a ConcreteImplementor in a Bridge hierarchy might itself be an ' +
      'Adapter wrapping a legacy or third-party system" — but neither codeTab on the page ever shows this. ' +
      'Both <code>EmailChannel</code> and <code>SmsChannel</code> are written from scratch against ' +
      '<code>INotificationChannel</code> directly; there is no legacy system involved anywhere.',
      'This is a genuinely common real-world shape: you design a Bridge because you know you need MULTIPLE ' +
      'notification channels, and one of those channels happens to be a legacy fax/telex system you cannot ' +
      'rewrite — its awkward native API needs Adapter, while the overall notification design still needs ' +
      'Bridge.',
    ],
  },
  {
    heading: 'Two Different Jobs, Cleanly Separated',
    points: [
      'The Bridge\'s job is deciding WHICH channel a <code>Notification</code> talks to — swap ' +
      '<code>EmailChannel</code> for a fax channel and nothing about <code>OrderConfirmation</code> changes.',
      'The Adapter\'s job, once you are INSIDE that one fax channel, is translating the legacy system\'s ' +
      'native method signatures into the shape <code>INotificationChannel</code> requires. These jobs never ' +
      'blur together — the Adapter class exists entirely inside one ConcreteImplementor, invisible to every ' +
      'other part of the Bridge.',
      'The rest of the Bridge hierarchy (<code>Notification</code>, <code>OrderConfirmation</code>, ' +
      '<code>EmailChannel</code>, <code>SmsChannel</code>) has no idea one of its implementors happens to be ' +
      'an Adapter internally — from the outside, a <code>LegacyFaxChannel</code> is just another ' +
      '<code>INotificationChannel</code>, indistinguishable from any other.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A ConcreteImplementor Built from an Adapter',
    language: 'csharp',
    code: `// The legacy fax system — cannot be changed, has its own incompatible API
public class LegacyFaxTransmitter
{
    public int SendFax(string faxNumber, string coverSheetText)
    {
        Console.WriteLine($"[legacy fax hardware] dialing {faxNumber}...");
        Console.WriteLine($"[legacy fax hardware] transmitting: {coverSheetText}");
        return 0; // 0 = success, per the legacy device's own status-code convention
    }
}

// The Adapter — translates INotificationChannel's shape onto LegacyFaxTransmitter's shape.
// This class's ONLY job is translation; it contains no Bridge-related logic at all.
public class LegacyFaxAdapter(LegacyFaxTransmitter fax) : INotificationChannel
{
    public Task SendAsync(string recipient, string subject, string body)
    {
        // Translate: (recipient, subject, body) -> (faxNumber, coverSheetText)
        var coverSheet = $"{subject}\\n\\n{body}";
        int status = fax.SendFax(recipient, coverSheet);

        return status == 0
            ? Task.CompletedTask
            : Task.FromException(new InvalidOperationException($"Fax failed, code {status}"));
    }
}

// From the Bridge's point of view, LegacyFaxAdapter is just another
// INotificationChannel — OrderConfirmation, the rest of the hierarchy, and
// every OTHER channel remain completely unaware an Adapter is involved.
var fax = new LegacyFaxAdapter(new LegacyFaxTransmitter());
await new OrderConfirmation(fax, "ORD-456").SendAsync("+1-555-0100");

// Swapping channels needs no changes anywhere else — same call shape as
// the main page's Email/Sms example, even though this one adapts a legacy system.
await new OrderConfirmation(new EmailChannel(), "ORD-456").SendAsync("user@example.com");`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate suggests it would be simpler to skip the Adapter entirely and just make ' +
    '<code>OrderConfirmation</code> call <code>LegacyFaxTransmitter.SendFax(faxNumber, coverSheetText)</code> ' +
    'directly for fax orders, with a special case. What does the Bridge design lose if you take that ' +
    'shortcut?',
  hint:
    'Think about what OrderConfirmation currently knows about, and what it would have to start knowing about ' +
    'if the shortcut were taken.',
  solution:
    'OrderConfirmation (and every other Refined Abstraction) currently depends ONLY on the INotificationChannel ' +
    'interface — it has no idea whether it is talking to email, SMS, or a legacy fax machine. Calling ' +
    'SendFax(faxNumber, coverSheetText) directly would force OrderConfirmation to know about ' +
    'LegacyFaxTransmitter\'s specific method name, parameter order, and status-code convention, and to branch ' +
    'on "is this a fax recipient?" internally. That reintroduces exactly the coupling Bridge exists to prevent ' +
    '— every Refined Abstraction that might ever send a fax would need its own special case, and adding a ' +
    'FOURTH channel later would mean touching every one of them instead of writing one new ' +
    'INotificationChannel implementation.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'If a ConcreteImplementor is "really" an Adapter internally, the pattern should be called ' +
      'Adapter, not Bridge.',
    reality:
      'The name describes the role a class plays from the OUTSIDE, at each level of the design. From the ' +
      'Bridge hierarchy\'s point of view, LegacyFaxAdapter is a ConcreteImplementor — it satisfies ' +
      'INotificationChannel like any other. That the class internally does Adapter-style translation work to ' +
      'satisfy that role is a separate, nested design decision, not a contradiction.',
  },
  {
    thought: 'Combining two patterns in one codebase always signals overengineering.',
    reality:
      'Patterns combine naturally when a real system genuinely has both problems at once: here, "we need ' +
      'several interchangeable notification channels" (Bridge\'s problem) and "one of those channels is a ' +
      'legacy system with an incompatible API" (Adapter\'s problem) are both true simultaneously, and each ' +
      'pattern solves its own piece cleanly without the other pattern\'s logic leaking in.',
  },
  {
    thought: 'The Adapter class needs to know it is being used inside a Bridge, so it can behave correctly.',
    reality:
      'LegacyFaxAdapter has zero awareness of Notification, OrderConfirmation, or the rest of the Bridge ' +
      'hierarchy — it only knows about LegacyFaxTransmitter and the INotificationChannel interface it must ' +
      'satisfy. This isolation is exactly what makes the combination safe: neither pattern needs to know ' +
      'anything about how the other is being used around it.',
  },
];

@Component({
  selector: 'app-bridge-bridge-wrapping-an-adapter',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bridge-wrapping-an-adapter.html',
  styleUrl: './bridge-wrapping-an-adapter.scss',
})
export class BridgeWrappingAnAdapterSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
