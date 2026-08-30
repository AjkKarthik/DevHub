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
  templateUrl: './what-monostate-actually-looks-like-in-code.html',
  styleUrl: './what-monostate-actually-looks-like-in-code.scss'
})
export class WhatMonostateActuallyLooksLikeInCodeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A whole theory section, and a QnA entry, with zero code',
      points: [
        'The main page dedicates an entire theory section to Monostate: "All state is static but the constructor is public — every instance shares the same state... More transparent than Singleton but still suffers from global mutable state issues." The QnA adds more detail (how it differs from Singleton, why it is unusual). Neither ever shows Monostate in actual code.',
        'This matters because Monostate\'s defining trick — object identity looks completely normal (<code>new MyClass()</code> works, you get a real instance back) while the STATE behind that instance is secretly shared across every instance — is much easier to see than to describe in prose.',
      ]
    },
    {
      heading: 'What "every instance shares the same state" actually looks like',
      points: [
        'A Monostate class has a PUBLIC constructor (unlike Singleton\'s private one) and looks, from the outside, like an ordinary class you can instantiate freely — <code>new Settings()</code>, <code>new Settings()</code> again, as many times as you like.',
        'The trick is entirely in the FIELDS: every field is <code>static</code>, so every one of those "separate" instances is reading and writing the SAME underlying storage. Two completely different <code>Settings</code> objects, constructed independently, with no reference to each other, will observe each other\'s writes immediately.',
        'This is the "more testable than classic Singleton" claim the QnA makes: you genuinely CAN construct a real instance and pass it around, inject it as a constructor parameter, hold multiple references — none of the usual Singleton friction. But the underlying shared-mutable-state problem the theory names is still fully present, just hidden one layer deeper than a Singleton\'s obvious <code>.Instance</code> access point.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Monostate — normal-looking instances, shared state underneath',
      language: 'csharp',
      code: `public class Settings
{
    // static -- this is ALL of Monostate's magic. Every field the
    // class has is static, so there is really only one copy of this
    // data, no matter how many "instances" get constructed.
    private static string _theme = "light";
    private static int _pageSize = 20;

    // PUBLIC constructor -- unlike Singleton, nothing stops you from
    // creating as many "instances" as you like.
    public Settings() { }

    // These read/write the STATIC fields, even though they are called
    // through an instance reference like any normal instance method.
    public string Theme
    {
        get => _theme;
        set => _theme = value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value;
    }
}

// Two completely independent instances -- no reference to each other
var settingsA = new Settings();
var settingsB = new Settings();

settingsA.Theme = "dark";

Console.WriteLine(settingsB.Theme); // "dark" -- NOT "light"!
// settingsB never touched settingsA, was constructed completely
// separately, yet observes the write instantly -- because both
// instances are reading the SAME static field underneath.

// Compare to an ordinary class with instance (non-static) fields --
// this is what Monostate is deliberately NOT doing:
public class OrdinarySettings
{
    public string Theme { get; set; } = "light"; // instance field
}
var ordinaryA = new OrdinarySettings();
var ordinaryB = new OrdinarySettings();
ordinaryA.Theme = "dark";
Console.WriteLine(ordinaryB.Theme); // "light" -- genuinely independent`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "Monostate is strictly better than Singleton for testability, since you can construct real instances and inject them like any normal class." Does constructing a real instance solve the shared-mutable-state problem the theory names as Singleton\'s core issue?',
    hint: 'If a test constructs its own Settings instance and sets Theme to a test-specific value, does that write stay isolated to the test?',
    solution: 'No -- constructing a real, injectable instance solves the COUPLING problem (Monostate objects are not hardwired to a global static accessor, so they CAN be passed around and injected like a normal dependency), but it does nothing for the SHARED-STATE problem. A test that constructs its own Settings and sets Theme = "test-value" is writing to the exact same static field every other Settings instance in the process reads from -- including instances constructed by completely unrelated code running concurrently, or by a previous test that never cleaned up. This is precisely the gap the page\'s own QnA elsewhere names for DI-registered singletons too: solving the coupling/injectability problem does not automatically solve a shared-mutable-state problem the class\'s own design still has.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Monostate lets you construct real, independent-looking instances with "new", each instance actually has its own separate state, just like an ordinary class.',
      reality: 'Per this subtopic\'s theory, every field on a Monostate class is static — every instance, no matter how it was constructed, reads and writes the exact same underlying storage as every other instance.'
    },
    {
      thought: 'Monostate is strictly more testable than Singleton because you can construct and inject real instances.',
      reality: 'Per this subtopic\'s theory, injectability solves the coupling problem but not the shared-mutable-state problem — a test-constructed instance still writes to the same static fields every other instance in the process reads from.'
    },
    {
      thought: 'A class using Monostate is easy to distinguish from an ordinary class just by reading its public API (constructors, method signatures).',
      reality: 'Per this subtopic\'s theory, Monostate is specifically deceptive this way — its public surface (a public constructor, ordinary-looking instance properties) looks identical to a normal class; the shared-state trick is only visible by checking whether the underlying FIELDS are declared static.'
    }
  ];
}
