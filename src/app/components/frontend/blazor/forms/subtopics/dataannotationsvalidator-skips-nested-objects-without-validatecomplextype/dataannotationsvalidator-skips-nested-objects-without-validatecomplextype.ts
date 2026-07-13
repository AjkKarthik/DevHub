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
  templateUrl: './dataannotationsvalidator-skips-nested-objects-without-validatecomplextype.html',
  styleUrl: './dataannotationsvalidator-skips-nested-objects-without-validatecomplextype.scss'
})
export class DataannotationsvalidatorSkipsNestedObjectsWithoutValidatecomplextypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The default DataAnnotationsValidator only walks the ROOT model\'s own properties, not the object graph beneath it',
      points: [
        'The main page\'s quiz question states this as a fact, but the practical scope is worth spelling out: if a Customer model has an Address property (itself a class with its own [Required]/[EmailAddress]-style attributes), the standard DataAnnotationsValidator validates Customer\'s OWN properties (Name, Email, etc.) but does NOT descend into Address to check ITS properties at all — even though Address is right there on the model being validated.',
        'This is easy to miss during development because the bug is silent in the most dangerous way possible: the form compiles fine, EditForm renders fine, and the nested Address fields even show validation messages CORRECTLY if you manually call ctx.Validate() and separately inspect Address — the specific thing that is missing is DataAnnotationsValidator automatically including those nested checks as part of the SAME validation pass the rest of the form relies on.',
      ]
    },
    {
      heading: 'The fix requires TWO changes together — [ValidateComplexType] alone, or the different validator alone, is not sufficient',
      points: [
        'First, the nested property on the parent model needs a [ValidateComplexType] attribute (from Microsoft.AspNetCore.Components.DataAnnotations.Validation) — this tells the validation pipeline "this property is itself a validatable object, descend into it," since without this explicit opt-in marker, nothing on the Address property itself signals that it needs deep validation.',
        'Second, the EditForm must swap &lt;DataAnnotationsValidator /&gt; for &lt;ObjectGraphDataAnnotationsValidator /&gt; — the standard validator genuinely does not know how to interpret [ValidateComplexType] at all, so adding the attribute without ALSO swapping the validator component changes nothing observable; both pieces are required together for nested validation to actually activate.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent gap — Address validation never runs',
      language: 'csharp',
      code: `public class Customer
{
    [Required] public string Name { get; set; } = "";

    // No [ValidateComplexType] here — Address's own [Required]/
    // [EmailAddress] attributes are NEVER checked as part of this
    // form's validation, even though Address genuinely has them.
    public Address ShippingAddress { get; set; } = new();
}

public class Address
{
    [Required] public string Street { get; set; } = "";
    [Required] public string City { get; set; } = "";
}

<!-- CustomerForm.razor -->
<EditForm Model="customer" OnValidSubmit="Submit">
    <DataAnnotationsValidator />
    <!-- Only validates Customer.Name — Street and City's [Required]
         attributes are silently never evaluated, and OnValidSubmit
         fires even if both are left completely empty. -->
    <InputText @bind-Value="customer.Name" />
    <InputText @bind-Value="customer.ShippingAddress.Street" />
    <InputText @bind-Value="customer.ShippingAddress.City" />
    <button type="submit">Save</button>
</EditForm>`,
    },
    {
      label: 'The fix — both pieces together',
      language: 'csharp',
      code: `public class Customer
{
    [Required] public string Name { get; set; } = "";

    // Piece 1: marks this property as needing deep validation.
    [ValidateComplexType]
    public Address ShippingAddress { get; set; } = new();
}

<!-- CustomerForm.razor -->
<EditForm Model="customer" OnValidSubmit="Submit">
    <!-- Piece 2: the ONLY validator that understands
         [ValidateComplexType] — swapping just one piece without the
         other changes nothing observable. -->
    <ObjectGraphDataAnnotationsValidator />
    <InputText @bind-Value="customer.Name" />
    <InputText @bind-Value="customer.ShippingAddress.Street" />
    <InputText @bind-Value="customer.ShippingAddress.City" />
    <button type="submit">Save</button>
</EditForm>
@* Now Street and City's [Required] attributes are genuinely
   evaluated as part of the same OnValidSubmit check. *@`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds [ValidateComplexType] to a nested Address property, tests the form, and finds nested validation STILL does not work — the form still submits successfully with empty required nested fields. They are confused since the main page\'s guidance suggested this attribute is the fix. What is most likely still missing?',
    hint: 'Think about the TWO pieces this subtopic describes as both being required — did adding [ValidateComplexType] alone address both of them?',
    solution: 'The developer almost certainly forgot to also swap &lt;DataAnnotationsValidator /&gt; for &lt;ObjectGraphDataAnnotationsValidator /&gt; inside the EditForm. [ValidateComplexType] is only a MARKER attribute — it does not do any validation work itself, it just signals intent. The standard DataAnnotationsValidator genuinely does not know how to interpret that marker at all, so a form still using the standard validator will behave EXACTLY as if [ValidateComplexType] were never added, with nested validation still silently skipped. Both pieces — the marker attribute AND the validator component swap — are required together; adding either one alone produces no observable change, which is exactly the confusing symptom described here.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DataAnnotationsValidator automatically validates a model\'s entire object graph, including nested complex properties, since that is the intuitive behavior for "validate this model."',
      reality: 'The default DataAnnotationsValidator only validates the ROOT model\'s own direct properties — confirmed in this subtopic\'s first code example, where a nested Address property\'s [Required] attributes are never evaluated at all, even though they genuinely exist on the model, unless [ValidateComplexType] and ObjectGraphDataAnnotationsValidator are both explicitly added.'
    },
    {
      thought: 'Adding [ValidateComplexType] to a nested property is sufficient on its own to enable deep validation for that property.',
      reality: 'This subtopic\'s exercise shows [ValidateComplexType] alone changes nothing observable — it is purely a marker attribute that only the ObjectGraphDataAnnotationsValidator component understands; the standard DataAnnotationsValidator ignores it entirely, so BOTH the attribute and the validator swap are required together, not either one alone.'
    },
    {
      thought: 'Swapping to ObjectGraphDataAnnotationsValidator alone (without adding [ValidateComplexType] to the relevant properties) is enough to enable nested validation for the whole model.',
      reality: 'ObjectGraphDataAnnotationsValidator still needs [ValidateComplexType] on each specific property that should be validated deeply — it does not automatically treat every complex-typed property on the model as needing nested validation, so a property left without the marker attribute is still skipped even under the upgraded validator.'
    }
  ];
}
