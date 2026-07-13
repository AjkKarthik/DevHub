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
  templateUrl: './cascadingparameter-flows-through-any-depth-without-explicit-forwarding.html',
  styleUrl: './cascadingparameter-flows-through-any-depth-without-explicit-forwarding.scss'
})
export class CascadingparameterFlowsThroughAnyDepthWithoutExplicitForwardingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A regular [Parameter] only reaches ONE level down — CascadingValue reaches EVERY level down',
      points: [
        'The main page\'s QnA states the rule, but the render-tree mechanics are worth spelling out: a normal [Parameter] value only exists on the specific component instance it was set on. If a grandchild component three levels deep needs that same value, EVERY intermediate component in the chain must accept it as its OWN [Parameter] and explicitly re-pass it down again in ITS markup — a repetitive, easy-to-forget chain.',
        'CascadingValue works completely differently: it registers a value into an internal cascading-value registry scoped to that subtree of the render tree, not tied to any single component-to-component connection. ANY descendant component anywhere within that subtree — no matter how many intermediate components sit between it and the CascadingValue — can declare a matching [CascadingParameter] and receive the value directly, without any of the intermediate components needing to know the value exists at all.',
      ]
    },
    {
      heading: 'Why this makes CascadingParameter the correct tool specifically for cross-cutting concerns, and the WRONG tool for ordinary component communication',
      points: [
        'Because intermediate components are completely bypassed and uninvolved, a component consuming a [CascadingParameter] has an INVISIBLE dependency on some ancestor providing it — nothing in the component\'s own usage site reveals that dependency, unlike a regular [Parameter] which is always visible directly in the calling markup.',
        'This tradeoff is exactly right for values that generically apply to an entire subtree regardless of its specific shape — theme, current culture/locale, authentication state, a form\'s validation EditContext — where forcing every single intermediate component to explicitly re-declare and forward the value would be pure boilerplate with zero benefit.',
        'It becomes a genuine anti-pattern for ordinary parent-to-specific-child data — using CascadingValue there hides a dependency that would be much clearer, more discoverable, and more type-safe as an explicit [Parameter] passed directly in the markup.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without cascading — every level must forward it',
      language: 'csharp',
      code: `<!-- App.razor -->
<Layout Theme="@currentTheme" />

<!-- Layout.razor — must accept AND re-forward, even though it never uses Theme itself -->
@code { [Parameter] public string Theme { get; set; } = ""; }
<PageContent Theme="@Theme" />

<!-- PageContent.razor — ALSO must accept and re-forward -->
@code { [Parameter] public string Theme { get; set; } = ""; }
<UserCard Theme="@Theme" />

<!-- UserCard.razor — the component that FINALLY actually uses it -->
@code { [Parameter] public string Theme { get; set; } = ""; }
<div class="card card-@Theme">...</div>

@* Three intermediate components had to know about and forward a value
   they never actually use themselves — pure boilerplate that breaks
   the moment one level forgets to re-pass it. *@`,
    },
    {
      label: 'With CascadingValue — intermediate components are bypassed entirely',
      language: 'csharp',
      code: `<!-- App.razor -->
<CascadingValue Value="currentTheme" Name="Theme">
    <Layout />
</CascadingValue>

<!-- Layout.razor — no Theme parameter needed at all -->
<PageContent />

<!-- PageContent.razor — no Theme parameter needed at all -->
<UserCard />

<!-- UserCard.razor — receives it DIRECTLY from the CascadingValue,
     completely bypassing Layout and PageContent, neither of which
     ever mentions Theme anywhere in their own code. *@
@code {
    [CascadingParameter(Name = "Theme")]
    public string Theme { get; set; } = "";
}
<div class="card card-@Theme">...</div>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team uses CascadingValue to pass the current logged-in user\'s ShoppingCart object down to a specific CheckoutSummary component nested inside several layout components — no other component in the app needs the cart. A reviewer flags this as a design smell and suggests using an explicit [Parameter] chain instead, even though it means threading the cart through 3 intermediate components. Is the reviewer\'s concern reasonable?',
    hint: 'Think about the tradeoff this subtopic describes — when is bypassing intermediate components genuinely helpful, versus when does it just hide a dependency that would be clearer as an explicit parameter?',
    solution: 'The reviewer\'s concern is reasonable. CascadingValue is well-suited for values that genuinely apply broadly across a subtree regardless of its specific shape (theme, culture, auth state) — but a shopping cart consumed by exactly ONE specific descendant component is the opposite case: an ordinary parent-to-specific-child data flow. Using CascadingValue here hides a real dependency (CheckoutSummary needing the cart) from anyone reading the intermediate layout components\' code, and from anyone looking at CheckoutSummary\'s OWN usage site, since a [CascadingParameter] does not appear as a visible attribute where the component is used. An explicit [Parameter] chain is more boilerplate to write, but it makes the dependency fully visible and discoverable at every level — the correct tradeoff when only one specific consumer exists, exactly matching the "cross-cutting concern only" guidance this subtopic\'s theory describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CascadingValue and passing a [Parameter] through several levels are functionally interchangeable — CascadingValue is just a shorthand that saves typing the same parameter declaration at every level.',
      reality: 'They differ in a structurally important way, not just convenience: a [Parameter] chain requires EVERY intermediate component to explicitly know about and forward the value, while CascadingValue bypasses intermediate components entirely — confirmed in this subtopic\'s code examples, where the cascading version\'s Layout and PageContent components contain zero mention of Theme at all.'
    },
    {
      thought: 'Since CascadingValue reaches any depth, it is generally the more convenient, preferred choice over threading an explicit [Parameter] chain whenever a value needs to reach more than one level down.',
      reality: 'This subtopic\'s exercise shows the opposite guidance is often correct: CascadingValue trades away VISIBILITY (the dependency becomes invisible at both the consuming component\'s usage site and every intermediate level) for convenience — appropriate for genuine cross-cutting concerns, but a real design smell for ordinary parent-to-specific-child data with a single known consumer.'
    },
    {
      thought: 'A component receiving a [CascadingParameter] must be a DIRECT child of the component that declares the CascadingValue — cascading only skips ONE level, not arbitrarily many.',
      reality: 'CascadingValue reaches EVERY descendant at ANY depth within its subtree, confirmed in this subtopic\'s code example where UserCard receives Theme directly despite being nested two full component levels below the CascadingValue declaration, with neither intermediate component (Layout, PageContent) declaring or forwarding it at all.'
    }
  ];
}
