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
  templateUrl: './di-approach-referenced-an-undefined-push-notification-class.html',
  styleUrl: './di-approach-referenced-an-undefined-push-notification-class.scss'
})
export class DiApproachReferencedAnUndefinedPushNotificationClassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A third channel switched on, never declared anywhere',
      points: [
        'The "Classic Pattern" codeTab defines exactly two Concrete Products: <code>EmailNotification</code> and <code>SmsNotification</code>, both implementing <code>INotification</code>.',
        'The "DI Approach" codeTab\'s <code>NotificationFactory.Create(channel)</code> switches on three cases — <code>"email"</code>, <code>"sms"</code>, and <code>"push"</code> — with the <code>"push"</code> case returning <code>new PushNotification()</code>. But <code>PushNotification</code> was never declared anywhere on the page. In real C#, this is <code>CS0246: The type or namespace name \'PushNotification\' could not be found</code>.',
        'This is not a fabricated third option, either — the page\'s own theory section, describing the Concrete Products in the abstract, already lists all three: "ConcreteProduct: the specific type created (EmailNotification, SmsNotification, PushNotification)." The theory anticipated a third product; the code just never actually wrote it.',
      ]
    },
    {
      heading: 'Why this slipped through a two-codeTab page more easily than a one-codeTab page would',
      points: [
        'The "Classic Pattern" codeTab is self-contained and internally consistent — every class it defines, it uses; every class it uses, it defines. Read on its own, it has no bug at all.',
        'The "DI Approach" codeTab is a SEPARATE example demonstrating a different technique (a switch-based factory instead of subclassing) — and it reuses <code>EmailNotification</code>/<code>SmsNotification</code> from the FIRST codeTab without redefining them, which is a legitimate, established pattern on this page (the two codeTabs are meant to be read together, sharing the same <code>INotification</code> product hierarchy).',
        'The bug lives specifically in the GAP between the two codeTabs: the second one silently introduced a THIRD case the first one never defined, and because the two are visually separate code blocks, there is no single place where a reader (or the author) would naturally see both "declared classes" and "referenced classes" side by side to notice the mismatch.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually compiles vs. what the page originally showed',
      language: 'csharp',
      code: `// Classic Pattern codeTab defines exactly these two products:
public class EmailNotification : INotification { /* ... */ }
public class SmsNotification : INotification { /* ... */ }
// PushNotification -- never defined anywhere on the original page

// DI Approach codeTab's switch, as originally written:
public INotification Create(string channel) => channel switch
{
    "email" => new EmailNotification(),
    "sms"   => new SmsNotification(),
    "push"  => new PushNotification(),   // CS0246: type not found
    _       => throw new ArgumentException(/* ... */)
};

// THE FIX -- add the missing product, matching the theory section's
// own (already-correct) list of three concrete products
public class PushNotification : INotification
{
    public void Send(string recipient, string message) =>
        Console.WriteLine($"Push → {recipient}: {message}");
}

// Now every case in the switch has a real, declared type behind it:
public INotification Create(string channel) => channel switch
{
    "email" => new EmailNotification(),
    "sms"   => new SmsNotification(),
    "push"  => new PushNotification(),   // now compiles
    _       => throw new ArgumentException($"Unknown channel: {channel}")
};`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "The theory section already lists PushNotification as one of the three products, so the codeTabs must be consistent with it — I don\'t need to double check the actual class definitions." Is trusting the prose description a reliable way to verify the code compiles?',
    hint: 'Does a THEORY bullet point (plain text) go through the same compiler that a codeTab\'s code does?',
    solution: 'No -- theory prose and codeTab code are verified completely differently, and one being correct says nothing about the other. The theory bullet is just text describing the pattern\'s SHAPE in the abstract -- it was accurate about what a complete example SHOULD contain. The codeTab is real code that has to actually compile. In this case the theory happened to be right (three products were the right number) while the code was incomplete (only two were ever declared) -- but there is no mechanism connecting the two; an author (or reader) has to check the actual class declarations against actual usages directly, the same way this subtopic did, rather than treating consistent-sounding prose elsewhere on the page as proof the code is complete.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a page\'s theory or prose description already mentions a class by name, the codeTabs on the same page are guaranteed to actually define it.',
      reality: 'Per this subtopic\'s theory, the theory section and the codeTabs are verified completely independently — this page\'s own theory correctly named all three products in prose while one codeTab used a third product no codeTab ever declared.'
    },
    {
      thought: 'A codeTab that only reuses classes from an earlier codeTab (rather than redefining everything) is less likely to have a missing-declaration bug, since it\'s reusing already-verified code.',
      reality: 'Per this subtopic\'s theory, reusing classes from an earlier codeTab is exactly the situation where a NEW, undeclared reference is easiest to introduce unnoticed — the earlier codeTab genuinely was complete and correct on its own; the gap only exists in what the later codeTab additionally assumes.'
    },
    {
      thought: 'This kind of bug can only happen in TypeScript, where implicit-any and structural typing make missing declarations easy to miss.',
      reality: 'Per this subtopic\'s theory, this specific bug is in C# code, a strictly and nominally typed language — CS0246 ("type or namespace name could not be found") is exactly the kind of hard compile error C#\'s type system is designed to catch, confirming this class of bug is not language-specific.'
    }
  ];
}
