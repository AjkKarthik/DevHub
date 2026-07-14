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
  templateUrl: './supplyparameterfromform-only-binds-on-a-real-post-not-first-load.html',
  styleUrl: './supplyparameterfromform-only-binds-on-a-real-post-not-first-load.scss'
})
export class SupplyparameterfromformOnlyBindsOnARealPostNotFirstLoadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '[SupplyParameterFromForm] only has data to bind AFTER a genuine form submission has happened',
      points: [
        'The main page shows [SupplyParameterFromForm] populating a model property, but the mechanism is worth spelling out precisely: on the FIRST load of a Static SSR page (a plain GET request), there is no posted form data at all — the property decorated with [SupplyParameterFromForm] is simply left at whatever its own default initializer produces (typically new()), exactly as if the attribute were not there.',
        'The property only actually gets POPULATED FROM THE FORM after the browser performs a real HTTP POST back to that same page (the user clicks submit) — Blazor\'s Static SSR pipeline reads the posted form fields matching the model\'s property names and constructs the bound object from them, on that specific request only.',
      ]
    },
    {
      heading: 'Why the FormName / @formname pairing exists, and what breaks without it',
      points: [
        'A single Static SSR page can host MULTIPLE distinct EditForm elements (say, a "search" form and a separate "subscribe" form) — FormName on EditForm and the corresponding hidden @formname field are how Blazor\'s server-side POST handler figures out WHICH of the several possible forms on the page was actually the one just submitted, since a single page-level POST request otherwise has no inherent way to distinguish between them.',
        'If FormName is omitted (or two different EditForm elements on the same page accidentally share the same FormName), [SupplyParameterFromForm] binding becomes unreliable or ambiguous — the server genuinely cannot tell which form\'s fields belong to which model, since the disambiguation mechanism the whole feature depends on is missing or colliding.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'First load — the property is just its default, not "empty from a POST"',
      language: 'csharp',
      code: `@page "/contact"

<EditForm FormName="contact" Model="model" method="post" OnValidSubmit="Submit">
    <DataAnnotationsValidator />
    <InputText @bind-Value="model.Message" />
    <button type="submit">Send</button>
</EditForm>

@code {
    [SupplyParameterFromForm]
    private ContactModel model { get; set; } = new();
    // On the VERY FIRST GET request to /contact, there has been no
    // POST yet — model is simply a fresh new ContactModel(), exactly
    // as if [SupplyParameterFromForm] were not present at all. The
    // attribute has nothing to bind FROM until a real form
    // submission actually happens.
}`,
    },
    {
      label: 'After a real POST — the model is genuinely populated from posted fields',
      language: 'csharp',
      code: `// The SAME page, SAME @page "/contact" route — but this time the
// request is a POST (the user clicked "Send"), carrying form fields
// whose names match ContactModel's own property names.
//
// Blazor's Static SSR pipeline:
// 1. Sees the incoming request is a POST matching FormName="contact"
// 2. Reads the posted "Message" field
// 3. Constructs a NEW ContactModel with Message set from that field
// 4. Assigns it to the [SupplyParameterFromForm] property BEFORE
//    OnInitialized runs, so validation/submit logic sees real data
//
// This is why the SAME property looks empty on first GET load and
// genuinely populated after a real submit — it is not "clearing" or
// "resetting" anything, it is simply two different requests, one
// with posted data available and one without.`,
    },
    {
      label: 'Two forms on one page — why FormName disambiguation matters',
      language: 'csharp',
      code: `@page "/dashboard"

<!-- Form A: search -->
<EditForm FormName="search" Model="searchModel" method="post" OnValidSubmit="Search">
    <InputText @bind-Value="searchModel.Query" />
    <button type="submit">Search</button>
</EditForm>

<!-- Form B: newsletter subscribe -->
<EditForm FormName="subscribe" Model="subscribeModel" method="post" OnValidSubmit="Subscribe">
    <InputText @bind-Value="subscribeModel.Email" />
    <button type="submit">Subscribe</button>
</EditForm>

@code {
    [SupplyParameterFromForm(FormName = "search")]
    private SearchModel searchModel { get; set; } = new();

    [SupplyParameterFromForm(FormName = "subscribe")]
    private SubscribeModel subscribeModel { get; set; } = new();

    // Without the DISTINCT FormName values above (matching each
    // EditForm's own FormName), Blazor's POST handler has no
    // reliable way to know which form's fields belong to
    // searchModel versus subscribeModel when either is submitted.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices that on the very first visit to a Static SSR contact form page, the Message field appears blank as expected — but concludes this proves [SupplyParameterFromForm] is "working correctly by clearing the field." A teammate says this reasoning is backwards. Who is right?',
    hint: 'Think about what actually happened on that first visit — was there ever any posted data for [SupplyParameterFromForm] to have "cleared" in the first place?',
    solution: 'The teammate is right — the reasoning is backwards. On a first visit (a plain GET request), there is no posted form data at all, so there was nothing for [SupplyParameterFromForm] to "clear" — the property is simply sitting at its own default initializer (new()) exactly as it would be with or without the attribute present. Framing this as "clearing" implies the attribute is actively doing something to empty out previously-submitted data, but that is not what is happening: [SupplyParameterFromForm] only has any effect at all on a request that genuinely carries POSTed form data matching its FormName. A first GET-request visit and a "successfully cleared after submit" state are indistinguishable by looking at the model alone — the correct way to verify [SupplyParameterFromForm] is actually working is to submit the form with real data and confirm the SAME page, on the resulting POST, shows that data populated.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '[SupplyParameterFromForm] actively resets or clears its bound property to a default value on every page load, as part of its own binding behavior.',
      reality: 'This subtopic\'s exercise clarifies there is no "clearing" happening at all on a first load — a plain GET request simply never had any posted data to bind from in the first place, so the property is just its ordinary default initializer, identical to how it would look without the attribute present.'
    },
    {
      thought: 'A single EditForm with [SupplyParameterFromForm] does not need an explicit FormName if it is the only form on the page.',
      reality: 'While a single-form page may work without an explicit conflict, the main page\'s own established pattern always pairs EditForm\'s FormName with a matching [SupplyParameterFromForm(FormName = ...)] — this subtopic\'s multi-form example shows why the pairing exists structurally: the moment a SECOND form is added to the same page, omitting FormName creates genuine binding ambiguity, so establishing the pairing from the start avoids a later refactor.'
    },
    {
      thought: 'Since [SupplyParameterFromForm] is applied to a property, the binding happens continuously, the same way a regular two-way @bind keeps a property synced with user input as they type.',
      reality: 'This subtopic\'s second code example shows the binding is a ONE-TIME reconstruction that happens specifically during a POST request\'s server-side processing, before OnInitialized runs — it is not a live, continuous sync with the browser the way client-side @bind is; the model is simply set once from the posted values for that specific request.'
    }
  ];
}
