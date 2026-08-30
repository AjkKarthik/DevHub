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
    heading: 'Described in the Abstract, Never Traced in Code',
    points: [
      'The main page\'s own "SOLID as a Coherent Set" theory and QnA both make the SAME claim in the abstract: "a class violating Single Responsibility... typically also becomes harder to extend without modification (violating Open/Closed)" and "a fat class violating SRP often violates ISP (fat interface) and OCP." Neither ever traces ONE concrete class through this cascade step by step — the main page\'s own SRP and OCP examples (<code>UserManager</code>, <code>DiscountCalculator</code>) are presented as SEPARATE, unrelated violations, not one class exhibiting both problems at once.',
      'This subtopic builds exactly that: one class that starts by violating SRP, and traces MECHANICALLY — not just asserted — why that same class also ends up violating OCP and ISP, using the main page\'s own vocabulary and fix patterns throughout.',
    ],
  },
  {
    heading: 'The Mechanical Link, Not Just the Assertion',
    points: [
      'A class handling multiple responsibilities (SRP violation) typically exposes a public surface covering ALL of them — which means any caller depending on that class is now coupled to methods it doesn\'t use (ISP violation), and any NEW requirement for any ONE responsibility usually means editing the SAME shared class (OCP violation), since there\'s no separate extension point per responsibility.',
      'Splitting the class by responsibility (the SRP fix) mechanically FIXES the other two as a side effect: each new focused class exposes only ITS OWN methods (ISP satisfied automatically), and each responsibility now has its own extension point a caller can implement without touching the others (OCP satisfied automatically) — this is the concrete mechanism behind the main page\'s own abstract claim.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'One Class, Three Violations',
    language: 'csharp',
    code: `// SRP violation: notifications, formatting, and delivery-channel
// selection are three separate responsibilities in one class.
public class OrderNotifier
{
    // Returns the formatted message after sending -- the ONLY way any
    // caller can get at the formatted text at all, since formatting
    // and sending were never split into separate responsibilities.
    public string NotifyOrderPlaced(Order order, string channel)
    {
        var message = channel switch
        {
            "email" => FormatEmailMessage(order),
            "sms"   => FormatSmsMessage(order),
            // OCP violation: adding "push" means editing THIS switch,
            // inside the SAME class that also does formatting AND
            // delivery -- there is no separate extension point per
            // responsibility to add a new channel into instead.
            _ => throw new NotSupportedException($"Unknown channel: {channel}")
        };

        if (channel == "email") SendEmail(order.CustomerEmail, message);
        else if (channel == "sms") SendSms(order.CustomerPhone, message);

        return message;
    }

    private string FormatEmailMessage(Order order) => $"<h1>Order {order.Id} confirmed</h1>";
    private string FormatSmsMessage(Order order)    => $"Order {order.Id} confirmed";
    private void SendEmail(string to, string body) { /* SMTP */ }
    private void SendSms(string to, string body)   { /* SMS gateway */ }
}

// ISP consequence: a caller that ONLY needs to format a message for
// logging (never actually send it) still has to depend on this
// entire class -- SendEmail/SendSms are methods it will never call,
// but there is no smaller interface exposing JUST formatting.
public class OrderAuditLogger(OrderNotifier notifier)
{
    public void LogFormattedMessage(Order order) =>
        Console.WriteLine(notifier.NotifyOrderPlaced(order, "email"));
        // ^ actually SENDS an email just to get formatted text for a log --
        // a direct, visible symptom of depending on a class doing too much.
}`,
  },
  {
    label: 'Splitting by Responsibility Fixes All Three',
    language: 'csharp',
    code: `// SRP fix: one responsibility per class.
public interface INotificationFormatter { string Format(Order order); }
public interface INotificationSender    { void Send(string to, string body); }

public class EmailFormatter : INotificationFormatter
{
    public string Format(Order order) => $"<h1>Order {order.Id} confirmed</h1>";
}
public class SmsFormatter : INotificationFormatter
{
    public string Format(Order order) => $"Order {order.Id} confirmed";
}

// OCP fix, as a direct SIDE EFFECT of the SRP fix: adding "push" is
// a NEW class implementing INotificationFormatter/INotificationSender --
// zero changes to any existing formatter or sender.
public class PushFormatter : INotificationFormatter
{
    public string Format(Order order) => $"Order {order.Id} confirmed";
}

// ISP fix, also a side effect: OrderAuditLogger now depends ONLY on
// the formatting interface -- it never sees Send() at all, so there
// is no risk of accidentally triggering a real send just to log text.
public class OrderAuditLogger(INotificationFormatter formatter)
{
    public void LogFormattedMessage(Order order) =>
        Console.WriteLine(formatter.Format(order));   // pure formatting, no sending
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new requirement arrives: push notifications need their OWN delivery logic (a push gateway SDK), not just their own formatting. Using the SPLIT version, which existing classes need to change, and which new class(es) need to be added?',
  hint: 'Check what <code>INotificationSender</code> already looks like, and whether <code>PushFormatter</code> already covers delivery too.',
  solution: `// No EXISTING class needs to change at all. Only a new class needs
// to be added: a PushSender implementing INotificationSender,
// alongside the PushFormatter that already exists from before:

public class PushSender : INotificationSender
{
    public void Send(string to, string body) { /* push gateway SDK call */ }
}

// EmailFormatter, SmsFormatter, EmailSender, SmsSender, and
// OrderAuditLogger are all completely untouched -- the OCP
// consequence of the SRP fix means adding a genuinely new delivery
// channel is purely additive, the same "new class, zero edits"
// shape the main page's own DiscountCalculator/IDiscountStrategy
// example demonstrates for adding a new discount type.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'OCP and ISP violations are separate problems from SRP that just happen to co-occur sometimes — fixing SRP is unrelated to fixing them.',
    reality: 'In THIS example (and often in practice), they aren\'t independent at all — the OCP and ISP violations exist SPECIFICALLY BECAUSE all three responsibilities were bundled into one class. Splitting by responsibility isn\'t three separate fixes bundled together; it\'s ONE fix (separate the responsibilities) whose side effects happen to satisfy OCP and ISP automatically, without any additional design work targeting those two principles specifically.',
  },
  {
    thought: 'The <code>OrderAuditLogger</code> calling <code>NotifyOrderPlaced(order, "email")</code> just to get formatted text is a minor inefficiency, not a real design problem worth highlighting.',
    reality: 'It is a directly OBSERVABLE symptom, not just an abstract violation — that logging call genuinely triggers sending a real email as an unwanted side effect, purely because there was no smaller interface exposing JUST the formatting behaviour it actually needed. This is exactly the kind of concrete, visible consequence the main page\'s own ISP theory describes ("Fat interfaces cause compilation coupling") made tangible: here it\'s not just a compile-time coupling cost, it\'s an actual unwanted runtime side effect.',
  },
];

@Component({
  selector: 'app-dp-solid-cascade',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tracing-how-one-srp-violation-cascades.html',
  styleUrl: './tracing-how-one-srp-violation-cascades.scss',
})
export class TracingHowOneSrpViolationCascadesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
