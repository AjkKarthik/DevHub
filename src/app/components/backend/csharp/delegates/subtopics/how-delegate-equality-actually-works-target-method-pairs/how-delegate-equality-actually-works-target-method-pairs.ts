import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-delegate-equality-actually-works-target-method-pairs-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-delegate-equality-actually-works-target-method-pairs.html',
  styleUrl: './how-delegate-equality-actually-works-target-method-pairs.scss',
})
export class HowDelegateEqualityActuallyWorksTargetMethodPairsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "reference equality" — that\'s not quite the full story',
      points: [
        'The main Delegates page states: "Removing a subscriber with -= compares by reference equality of the delegate." This is a simplification that is CLOSE to correct for lambdas, but genuinely misleading for method-group delegates — two SEPARATELY CREATED delegate objects pointing at the same target instance and method are considered EQUAL by <code>-=</code>, even though they are different objects in memory. Real reference equality (<code>ReferenceEquals</code>) would say these are different objects; delegate equality says otherwise.',
      ],
    },
    {
      heading: 'Delegate equality is actually a (target, method) pair comparison',
      points: [
        '<code>Delegate.Equals</code> (which <code>==</code> and <code>-=</code> use for single-cast and multicast delegates) compares the underlying INVOCATION TARGET (the object instance the method is called on, or <code>null</code> for static methods) and the METHOD (via <code>MethodInfo</code>) — not the delegate wrapper object\'s own identity.',
        'This is why the main page\'s <code>SendEmail</code> method-group example works correctly: <code>service.OrderPlaced += SendEmail;</code> followed later by <code>service.OrderPlaced -= SendEmail;</code> succeeds even though each <code>+=</code>/<code>-=</code> implicitly creates a NEW delegate object wrapping <code>SendEmail</code> — because both wrap the SAME (null target, SendEmail method) pair, they compare equal despite being different objects.',
      ],
    },
    {
      heading: 'Why lambdas genuinely cannot be unsubscribed — it\'s about the closure, not the syntax',
      points: [
        'The main page correctly states you cannot unsubscribe a lambda you never stored a reference to — but the DEEPER reason is that each lambda expression evaluation creates a distinct compiler-generated closure INSTANCE (even two syntactically identical lambdas, evaluated twice, produce two different closure objects) — so the (target, method) pair genuinely differs between the subscribe-time lambda and any later lambda, even one that reads identically in source.',
        'A <code>static</code> lambda (C# 9, covered in the main page\'s closures section) that captures nothing still creates a fresh delegate WRAPPER on each evaluation by default, but because it has no distinct captured state, the compiler is FREE to cache and reuse a single instance across calls — this is an implementation detail permitted by having no per-evaluation closure state, not a language guarantee that changes the equality rule itself.',
      ],
    },
    {
      heading: 'Multicast delegate combination and removal follow the same target+method rule',
      points: [
        '<code>Delegate.Combine</code> (what <code>+=</code> desugars to) builds an ordered invocation list of the underlying single-cast delegates. <code>Delegate.Remove</code> (what <code>-=</code> desugars to) searches that list for the LAST entry whose (target, method) pair matches the one being removed, and removes only that one occurrence — not all matching occurrences, even if the same handler was subscribed multiple times.',
        'This "removes only the last match" behavior explains a genuinely surprising edge case: subscribing the same method-group handler twice and calling <code>-=</code> once leaves ONE subscription still active — the handler still fires once per event raise, which can look like a bug if you expected <code>-=</code> to fully unsubscribe after a single call.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different delegate objects, but "equal" — proving it directly',
      language: 'csharp',
      code: `public class Notifier
{
    public void SendEmail(object? sender, EventArgs e) =>
        Console.WriteLine("Email sent");
}

var notifier = new Notifier();

// Two SEPARATE delegate objects, created at two different points in time,
// both wrapping the SAME (notifier, SendEmail) target+method pair:
EventHandler handlerA = notifier.SendEmail;
EventHandler handlerB = notifier.SendEmail;

// Real reference equality says these are DIFFERENT objects:
Console.WriteLine(ReferenceEquals(handlerA, handlerB)); // False

// But delegate equality (what == and -= actually use) says they're equal:
Console.WriteLine(handlerA == handlerB); // True — same target+method pair
Console.WriteLine(handlerA.Equals(handlerB)); // True

// This is EXACTLY why the main topic's SendEmail example works correctly:
public class OrderService { public event EventHandler? OrderPlaced; }
var service = new OrderService();

service.OrderPlaced += notifier.SendEmail; // creates delegate object #1
service.OrderPlaced -= notifier.SendEmail; // creates delegate object #2 —
// a DIFFERENT object than #1, but delegate-equal to it, so -= successfully
// removes it despite never being the "same" object in the ReferenceEquals sense.`,
    },
    {
      label: 'Lambdas fail because each evaluation is a genuinely distinct closure',
      language: 'csharp',
      code: `public class Notifier
{
    public void SendEmail(object? sender, EventArgs e) => Console.WriteLine("Email sent");
}

var notifier = new Notifier();
var service = new OrderService();

// Two lambda expressions that read IDENTICALLY in source — but each
// evaluation of "(s, e) => notifier.SendEmail(s, e)" produces its own,
// separate compiler-generated closure instance:
service.OrderPlaced += (s, e) => notifier.SendEmail(s, e); // closure instance #1

// This does NOT remove the subscription above — the (target, method) pair
// here is (closure-instance-#2, the compiler-generated lambda method),
// which is a DIFFERENT pair than (closure-instance-#1, ...same method...),
// because closure-instance-#1 and closure-instance-#2 are different objects:
service.OrderPlaced -= (s, e) => notifier.SendEmail(s, e); // closure instance #2 — no match!

// Proof — the subscription from the first line is STILL active:
service.PlaceOrder(); // "Email sent" still prints — the -= above did nothing

// The fix, exactly as the main topic recommends — store ONE delegate
// reference and reuse it for both += and -=:
EventHandler handler = (s, e) => notifier.SendEmail(s, e);
service.OrderPlaced += handler; // same object both times
service.OrderPlaced -= handler; // this DOES remove it — same reference`,
    },
    {
      label: '-= removes only the LAST matching entry, not all of them',
      language: 'csharp',
      code: `public class Notifier
{
    public int CallCount;
    public void Ping(object? sender, EventArgs e) => CallCount++;
}

var notifier = new Notifier();
var service = new OrderService();

// Subscribing the SAME method-group handler twice — legal, and creates
// two entries in the multicast invocation list, both delegate-equal to
// each other (same target+method pair):
service.OrderPlaced += notifier.Ping;
service.OrderPlaced += notifier.Ping;

service.PlaceOrder(); // both entries fire
Console.WriteLine(notifier.CallCount); // 2

// -= removes only ONE occurrence — the invocation list still has one
// entry left, so the handler keeps firing:
service.OrderPlaced -= notifier.Ping;

service.PlaceOrder();
Console.WriteLine(notifier.CallCount); // 3 — NOT 2! One subscription remains.

// To fully remove a handler that was subscribed multiple times, -= must
// be called once PER subscription:
service.OrderPlaced -= notifier.Ping;
service.PlaceOrder();
Console.WriteLine(notifier.CallCount); // 3 — now genuinely unsubscribed`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the "removes only the last match" behavior, predict the output of subscribing <code>notifier.Ping</code> THREE times and then calling <code>-= notifier.Ping</code> only ONCE, then raising the event. How many times does <code>Ping</code> fire?',
    hint: 'Each += creates a new invocation-list entry that is delegate-equal to the others (same target+method pair) but the entries themselves are still separate positions in the list. -= removes exactly one matching entry per call, regardless of how many equal entries exist.',
    solution: `var notifier = new Notifier();
var service = new OrderService();

service.OrderPlaced += notifier.Ping; // entry 1
service.OrderPlaced += notifier.Ping; // entry 2
service.OrderPlaced += notifier.Ping; // entry 3
// Invocation list now has 3 entries, all delegate-equal to each other.

service.OrderPlaced -= notifier.Ping; // removes exactly ONE entry — 2 remain

service.PlaceOrder();
Console.WriteLine(notifier.CallCount); // 2, not 1 and not 3

// Each += genuinely adds a new list position, even though the entries
// are delegate-equal — subscribing N times requires N calls to -= to
// fully remove the handler, one occurrence per call, regardless of how
// many equal entries remain in the list.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'delegate equality (what -= uses to find a match) is the same as reference equality — two delegate objects are only "equal" if they are literally the same object in memory.',
      reality: 'delegate equality compares the underlying (invocation target, method) pair, not the delegate wrapper object\'s own identity — two separately created delegates wrapping the same instance method are considered equal even though ReferenceEquals says they are different objects.',
    },
    {
      thought: 'two lambda expressions that read identically in source code will be treated as equal delegates, the same way two method-group references to the same method are.',
      reality: 'each evaluation of a (non-static, capturing) lambda expression creates its own distinct compiler-generated closure instance — even syntactically identical lambdas evaluated separately produce different (target, method) pairs and are NOT delegate-equal.',
    },
    {
      thought: 'calling -= once always fully removes a handler from a multicast delegate\'s invocation list, no matter how many times it was subscribed.',
      reality: '-= removes exactly ONE matching entry per call — if the same handler was subscribed N times (which is legal and creates N separate list entries), it takes N calls to -= to fully unsubscribe it.',
    },
  ];
}
