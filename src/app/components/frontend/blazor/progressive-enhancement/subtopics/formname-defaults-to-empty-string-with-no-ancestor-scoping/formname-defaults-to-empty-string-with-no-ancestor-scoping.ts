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
  templateUrl: './formname-defaults-to-empty-string-with-no-ancestor-scoping.html',
  styleUrl: './formname-defaults-to-empty-string-with-no-ancestor-scoping.scss'
})
export class FormnameDefaultsToEmptyStringWithNoAncestorScopingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quick reference already states "@formname Names a form for [SupplyParameterFromForm] binding" — the scoping rules underneath deserve the same attention already given to SectionName',
      points: [
        'Microsoft\'s documentation states form names must be unique to bind model data correctly — but this uniqueness requirement is NOT enforced anywhere at render time. The framework has no build-time or render-time check that flags a duplicate FormName; the observed failure only surfaces later, at the point an actual HTTP POST arrives and [SupplyParameterFromForm] tries to bind it.',
        'Omitting @formname/FormName entirely is not "no name" — it defaults to an actual value: an empty string. This means two forms on the same Static SSR page that BOTH omit FormName are not each independently unnamed; they both occupy the exact same empty-string identifier, exactly as if a developer had explicitly typed FormName="" on both.',
      ]
    },
    {
      heading: 'Just like SectionName, FormName is a flat, page-independent namespace by default — with its own explicit escape hatch',
      points: [
        'Two forms sharing the same FormName (whether that\'s an explicit duplicate string or the shared default empty string) don\'t produce a clean, distinguishable error — the practically observed failure mode is silent, incorrect cross-contamination, where [SupplyParameterFromFormAttribute] matching by input name within the colliding form scope binds data intended for one form onto the other.',
        'This scoping problem isn\'t limited to forms literally declared side-by-side in the same file — Blazor provides a dedicated FormMappingScope component specifically to wrap a form (commonly one supplied by a component library) so its FormName doesn\'t collide with an identically-named form used elsewhere in the app, confirming this is a genuinely flat, page-independent namespace by default, needing the same kind of deliberate scoping discipline already established for SectionName.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two unnamed forms on one page silently collide',
      language: 'csharp',
      code: `@page "/checkout"

<!-- Form 1: no FormName specified — defaults to the EMPTY STRING -->
<EditForm Model="shipping" method="post" OnValidSubmit="SaveShipping">
    <InputText @bind-Value="shipping.Address" />
    <button type="submit">Save Shipping</button>
</EditForm>

<!-- Form 2: ALSO no FormName specified — defaults to the SAME
     empty-string identifier as Form 1 above. These are not two
     independently "unnamed" forms — they occupy the identical
     scope. -->
<EditForm Model="billing" method="post" OnValidSubmit="SaveBilling">
    <InputText @bind-Value="billing.Address" />
    <button type="submit">Save Billing</button>
</EditForm>

@code {
    [SupplyParameterFromForm]
    private ShippingModel shipping { get; set; } = new();

    [SupplyParameterFromForm]
    private BillingModel billing { get; set; } = new();

    // BUG: submitting either form can bind incorrectly, since both
    // forms share the same empty-string FormName scope — there is
    // no build-time or render-time error warning about this.
}`,
    },
    {
      label: 'The fix — explicit, distinct FormName on every form',
      language: 'csharp',
      code: `@page "/checkout"

<EditForm Model="shipping" method="post" FormName="shipping" OnValidSubmit="SaveShipping">
    <InputText @bind-Value="shipping.Address" />
    <button type="submit">Save Shipping</button>
</EditForm>

<EditForm Model="billing" method="post" FormName="billing" OnValidSubmit="SaveBilling">
    <InputText @bind-Value="billing.Address" />
    <button type="submit">Save Billing</button>
</EditForm>

@code {
    [SupplyParameterFromForm]
    private ShippingModel shipping { get; set; } = new();

    [SupplyParameterFromForm]
    private BillingModel billing { get; set; } = new();
}

<!-- For a reusable component library's own internal form, wrap it
     in FormMappingScope so its FormName can't collide with an
     identically-named form used elsewhere in a consuming app:
     <FormMappingScope Name="my-library-widget">
         <EditForm ... FormName="settings">...</EditForm>
     </FormMappingScope> -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A checkout page has two EditForm elements — one for shipping details, one for billing details — and neither specifies a FormName. Submitting the shipping form occasionally causes billing fields to appear populated with data the user never entered into that form. A developer insists this can\'t be a FormName problem, "since neither form has a FormName set at all — there\'s nothing to collide." Is this reasoning correct? Explain what\'s actually happening.',
    hint: 'Does omitting @formname/FormName mean a form has NO identifier at all, or does it default to some specific value? If two forms both omit it, do they end up with different "no name" states, or the same one?',
    solution: 'The developer\'s reasoning is incorrect — omitting FormName does not mean "no identifier," it defaults to a specific, real value: an empty string. Since BOTH forms omit FormName, they don\'t each get their own independent "unnamed" state — they both occupy the exact same empty-string FormName scope, exactly as if a developer had explicitly written FormName="" on both. This is a genuine naming collision, just an implicit one rather than an obvious copy-pasted duplicate string. The observed symptom (billing fields populated with shipping data) is the practical failure mode of this collision: [SupplyParameterFromForm] binding by input name within a shared scope can cross-contaminate data between the two forms. The fix is giving each form an explicit, distinct FormName (e.g. "shipping" and "billing") — there is no way to have two genuinely independent "no name" forms on the same page, since the empty string IS a name like any other in this system.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Omitting @formname/FormName from an EditForm means that form has no identifier at all, so it can\'t collide with anything.',
      reality: 'This subtopic\'s theory clarifies omitting FormName defaults to a real, specific value — an empty string — meaning two forms that both omit it share the exact same identifier and can collide exactly like two forms with an identical explicit name.'
    },
    {
      thought: 'If two forms on the same page accidentally share a FormName, Blazor will catch this at build time or throw a clear runtime exception pointing at the problem.',
      reality: 'This subtopic\'s theory shows there is no such validation at render time — the framework only encounters the mismatch when an actual HTTP POST arrives, and the practically observed failure is silent, incorrect binding cross-contamination rather than a clear, diagnosable error.'
    },
    {
      thought: 'FormName only needs to be unique among forms literally declared in the same file or the same page component.',
      reality: 'This subtopic\'s theory shows FormName is a flat, page-independent namespace by default — the same pattern already established for SectionName — which is exactly why Blazor provides a dedicated FormMappingScope component specifically to prevent a reusable component library\'s own form from colliding with an identically-named form used elsewhere in a consuming app.'
    }
  ];
}
