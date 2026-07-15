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
  templateUrl: './blazor-already-skips-setparametersasync-for-unchanged-primitives.html',
  styleUrl: './blazor-already-skips-setparametersasync-for-unchanged-primitives.scss'
})
export class BlazorAlreadySkipsSetparametersasyncForUnchangedPrimitivesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The quiz already hints that IEqualityComparer helps Blazor "detect whether a parameter actually changed" — the real default behavior is more precise, and more generous, than "every parent re-render forces every child to re-render"',
      points: [
        'Internally, Blazor\'s diffing code compares a child component\'s OLD and NEW parameter values before deciding whether to call SetParametersAsync on it at all — it is NOT true that every parent re-render unconditionally forces SetParametersAsync on every child regardless of parameter values. For a fixed set of known-immutable types — numbers, strings, bool, char, DateTime, decimal, enum, Guid, DateOnly, TimeOnly, and EventCallback — Blazor already skips SetParametersAsync (and therefore the render) when every one of a component\'s parameters provably hasn\'t changed.',
        'This means a child component whose ONLY parameters are primitives (an int Count, a string Label) already gets this optimization automatically, with zero code from you — no ShouldRender override, no manual comparison needed. Adding your own equality check on top of already-primitive parameters is redundant, not a meaningful optimization.',
      ]
    },
    {
      heading: 'Where the real gap is: reference types are never compared by value, only by reference identity',
      points: [
        'For any parameter that is NOT on that fixed primitive whitelist — a custom class, a record, a List<T>, any reference type — Blazor\'s comparison is conservative by design: it always treats the parameter as "may have changed" and calls SetParametersAsync unconditionally, even if the new object is genuinely value-equal to the old one (a record with all the same field values, for instance). The framework has no general-purpose way to know whether an arbitrary object was mutated in place or is a fresh, coincidentally-identical instance, so it never risks assuming "unchanged" for anything beyond the primitive whitelist.',
        'This is precisely the gap a manual equality check (in ShouldRender, or comparing old vs. new values in SetParametersAsync/OnParametersSet) exists to close — and specifically ONLY for reference-type parameters. Applying the same technique to a component whose parameters are already all primitives adds code with no measurable benefit, since Blazor was already skipping the redundant render on its own.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Already optimized for free — no code needed',
      language: 'csharp',
      code: `<!-- ScoreBadge.razor — parameters are both primitives -->
@code {
    [Parameter] public int Score { get; set; }
    [Parameter] public string PlayerName { get; set; } = "";
}

<!-- Parent re-renders on every timer tick, but passes the SAME
     Score and PlayerName values to a specific ScoreBadge instance
     most of the time. Blazor's own parameter-comparison already
     skips SetParametersAsync (and the render) for THIS component
     when neither primitive value actually changed — no
     ShouldRender override needed here at all. -->`,
    },
    {
      label: 'The real gap — record/object parameters always re-invoke SetParametersAsync',
      language: 'csharp',
      code: `<!-- PlayerRow.razor — parameter is a record, NOT a primitive -->
@code {
    [Parameter] public Player Data { get; set; } = default!;
    private Player? lastData;

    // Blazor's own comparison does NOT apply here — Data is a
    // reference type (a record), so SetParametersAsync is called
    // EVERY time the parent re-renders, even if a NEW Player
    // instance happens to be value-equal to the old one.
    protected override bool ShouldRender()
    {
        if (Data == lastData) return false; // record structural equality
        lastData = Data;
        return true;
    }
}

<!-- record Player(int Id, string Name, int Score); -->
<!-- This manual check is where the real optimization opportunity
     is — not on ScoreBadge's already-optimized primitive
     parameters above. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer profiles their app and finds a ScoreBadge component (with only int and string parameters) and a PlayerRow component (with a single record Player parameter) both re-render far more often than expected. They add a manual ShouldRender equality check to BOTH components. After testing, ScoreBadge shows no measurable improvement, while PlayerRow shows a significant reduction in renders. Explain the difference, using what you know about which parameter types Blazor already compares by value.',
    hint: 'Does Blazor\'s default parameter comparison treat every parameter type the same way, or does it draw a line between a fixed set of primitive/immutable types and everything else (records, classes, collections)?',
    solution: 'The difference comes down to which parameter types Blazor already optimizes by default. ScoreBadge\'s parameters (int, string) are both on Blazor\'s fixed whitelist of immutable/primitive types that get compared by VALUE before SetParametersAsync is even called — so Blazor was ALREADY skipping the redundant render whenever those values genuinely hadn\'t changed, meaning the developer\'s manual ShouldRender check was redundant with an optimization the framework was already doing for free. PlayerRow\'s single parameter is a record — a reference type NOT on that whitelist — so Blazor conservatively calls SetParametersAsync every single time the parent re-renders, regardless of whether the new Player instance is value-equal to the old one. The developer\'s manual equality check on PlayerRow closes a REAL gap that Blazor\'s own comparison doesn\'t cover, which is exactly why it produced a measurable improvement there but not on ScoreBadge.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'By default, Blazor calls SetParametersAsync on every child component whenever the parent re-renders, with zero built-in optimization regardless of parameter type.',
      reality: 'This subtopic\'s theory clarifies Blazor already compares parameter values by VALUE for a fixed whitelist of primitive/immutable types before deciding whether to call SetParametersAsync — it is only reference types (records, classes, collections) that always trigger it unconditionally.'
    },
    {
      thought: 'Adding a manual ShouldRender equality check is always a safe, universally beneficial performance optimization to add to any component.',
      reality: 'This subtopic\'s exercise shows adding this check to a component whose parameters are ALL already-optimized primitives produces no measurable benefit — the real opportunity is specifically for components with record, class, or collection parameters, which Blazor\'s default comparison doesn\'t cover.'
    },
    {
      thought: 'A record parameter with structural equality (two instances with identical field values) is automatically treated as "unchanged" by Blazor the same way an unchanged int or string parameter is.',
      reality: 'This subtopic\'s theory shows Blazor\'s default comparison never checks structural/value equality for reference types at all — it always calls SetParametersAsync for a record parameter regardless of whether the new instance happens to have identical field values to the old one, which is exactly why a MANUAL structural equality check is needed to close that gap.'
    }
  ];
}
