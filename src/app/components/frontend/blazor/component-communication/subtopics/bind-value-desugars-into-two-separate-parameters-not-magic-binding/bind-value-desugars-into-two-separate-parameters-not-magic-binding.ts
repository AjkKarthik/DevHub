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
  templateUrl: './bind-value-desugars-into-two-separate-parameters-not-magic-binding.html',
  styleUrl: './bind-value-desugars-into-two-separate-parameters-not-magic-binding.scss'
})
export class BindValueDesugarsIntoTwoSeparateParametersNotMagicBindingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The @bind-X syntax is pure compile-time sugar over two ordinary attributes you could write yourself',
      points: [
        'The main page states the naming convention (a matching XChanged EventCallback is required) but the actual compiler transformation is worth seeing directly: <code>&lt;RatingPicker @bind-Value="myRating" /&gt;</code> is exactly equivalent to writing <code>&lt;RatingPicker Value="myRating" ValueChanged="(int v) =&gt; myRating = v" /&gt;</code> by hand — the Razor compiler is doing nothing more than generating that second attribute for you.',
        'This is why the naming convention matters so precisely: the compiler is looking for a parameter named EXACTLY "Value" plus another named EXACTLY "ValueChanged" (or whatever base name you used plus the literal suffix "Changed") — there is no runtime reflection or magic matching happening, it is a straightforward compile-time text transformation based on those exact names.',
      ]
    },
    {
      heading: '@bind-Value:event lets you override WHICH callback name the desugaring targets, revealing there is no hidden binding runtime at all',
      points: [
        'Since @bind-X is purely a compile-time expansion, Blazor also provides @bind-Value:event="SomeOtherChangedName" to override the second half of the generated pair — proving there is nothing special about the literal word "Changed" itself, only that the compiler needs SOME callback name to wire the second attribute to, and defaults to "Value" + "Changed" when you do not specify one.',
        'This also explains why a mismatched name (the main page\'s own mistake entry) fails completely silently rather than with any kind of runtime error: the compiler simply cannot find a parameter matching the name it expects, so it never generates the second attribute at all — the component still compiles and runs fine, it just never receives change notifications, because from the compiler\'s perspective there was nothing to wire up in the first place.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What @bind-Value actually expands to',
      language: 'csharp',
      code: `<!-- This: -->
<RatingPicker @bind-Value="myRating" />

<!-- ...compiles to EXACTLY this — two ordinary attributes,
     no different from writing them by hand: -->
<RatingPicker
    Value="myRating"
    ValueChanged="(int __value) => myRating = __value" />

@code {
    private int myRating = 3;
}

<!-- The Razor compiler is doing nothing more sophisticated than
     generating that second attribute for you, based on finding a
     parameter named "Value" and another named "ValueChanged" on
     RatingPicker's own [Parameter] declarations. -->`,
    },
    {
      label: '@bind-Value:event overrides the generated callback name',
      language: 'csharp',
      code: `<!-- RatingPicker.razor — using a DIFFERENT callback name on purpose -->
@code {
    [Parameter] public int Value { get; set; }
    [Parameter] public EventCallback<int> OnRatingCommitted { get; set; }
    // Deliberately NOT named "ValueChanged" — maybe this component
    // wants to fire the callback only on a final "commit" action,
    // not on every intermediate change.
}

<!-- Parent.razor — tell the compiler to target OnRatingCommitted
     instead of the default "ValueChanged" -->
<RatingPicker @bind-Value="myRating" @bind-Value:event="OnRatingCommitted" />

<!-- This desugars to: -->
<RatingPicker
    Value="myRating"
    OnRatingCommitted="(int v) => myRating = v" />

@* Proves there is no hardcoded runtime concept of "Changed" — it is
   purely a compile-time DEFAULT name the compiler reaches for when
   :event is not specified. *@`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a custom TagInput component with [Parameter] public List&lt;string&gt; Tags and [Parameter] public EventCallback&lt;List&lt;string&gt;&gt; TagsUpdated (deliberately not named TagsChanged, since their team\'s convention uses "Updated"). They then write &lt;TagInput @bind-Tags="myTags" /&gt; in a parent and are confused when it compiles but tag edits never update myTags. What went wrong?',
    hint: 'Think about what exact parameter NAME the compiler looks for by default when it sees @bind-Tags, and whether TagsUpdated matches that name.',
    solution: 'The compiler generated Tags="myTags" but could not find a parameter named exactly "TagsChanged" (the default it looks for), so it silently generated NO second attribute at all — TagInput compiles fine and receives the initial Tags value, but nothing is ever wired up to receive updates, since TagsUpdated does not match the name the compiler was looking for. This matches the main page\'s own mistake entry, but the ROOT cause is now visible: @bind-Tags is not searching for "any EventCallback the component happens to expose" — it specifically generates a second attribute named "TagsChanged" and only wires it up if a parameter with that EXACT name exists. The fix is either renaming TagsUpdated to TagsChanged to match the default convention, or explicitly telling the compiler to use the actual name: &lt;TagInput @bind-Tags="myTags" @bind-Tags:event="TagsUpdated" /&gt;.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '@bind-Value is a runtime binding mechanism — Blazor inspects the component at runtime, finds any EventCallback parameter, and wires it up to the bound variable automatically.',
      reality: 'This subtopic\'s first example shows @bind-Value is pure COMPILE-TIME text expansion — it generates exactly two ordinary attributes (Value and ValueChanged) at compile time, based on finding parameters with those EXACT names on the target component. There is no runtime inspection or flexible matching involved at all.'
    },
    {
      thought: 'The word "Changed" in the ValueChanged naming convention is a special, hardcoded suffix the Blazor runtime specifically recognizes for two-way binding.',
      reality: 'This subtopic\'s @bind-Value:event example proves otherwise — the "Changed" suffix is merely the DEFAULT name the compiler reaches for when no override is specified; @bind-Value:event lets you redirect the same desugaring to target any differently-named EventCallback, showing there is no special runtime significance to that specific word.'
    },
    {
      thought: 'If a component exposes SOME EventCallback parameter with a plausible name (even if not exactly matching the base-name-plus-Changed convention), @bind-X will find and use it automatically.',
      reality: 'This subtopic\'s exercise shows the opposite — a mismatched name (TagsUpdated instead of the expected TagsChanged) causes @bind-Tags to silently generate NO second attribute at all, compiling successfully but never wiring up any change notification, since the compiler performs an exact name match, not a flexible or fuzzy search for "any suitable callback."'
    }
  ];
}
