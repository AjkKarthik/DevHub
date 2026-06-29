import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-forms',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './forms.html',
  styleUrl: './forms.scss'
})
export class BlazorForms {
  quickRef: QuickRefItem[] = [
    { name: 'EditForm', type: 'keyword', desc: 'Blazor\'s form component that wraps an EditContext.' },
    { name: 'DataAnnotationsValidator', type: 'keyword', desc: 'Wires DataAnnotations attributes to the EditContext.' },
    { name: 'ValidationSummary', type: 'keyword', desc: 'Renders all validation messages for the form.' },
    { name: 'ValidationMessage<T>', type: 'keyword', desc: 'Shows validation errors for a specific field.' },
    { name: 'InputText', type: 'keyword', desc: 'Blazor input component that two-way binds a string.' },
    { name: 'InputNumber<T>', type: 'keyword', desc: 'Numeric input with built-in type parsing.' },
    { name: 'InputCheckbox', type: 'keyword', desc: 'Checkbox bound to a bool property.' },
    { name: 'EditContext', type: 'class', desc: 'Tracks form model state and validation results.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'EditForm and EditContext',
      points: ['EditForm wraps your form model in an EditContext which tracks which fields have been modified and what validation errors exist. You provide either a `Model` (EditForm creates the EditContext) or an explicit `EditContext`. Add `DataAnnotationsValidator` inside the form to enable attribute-based validation, and `ValidationSummary` or per-field `ValidationMessage<T>` to surface errors.',
      'EditForm + DataAnnotationsValidator = attribute-based validation.', 'OnValidSubmit fires only when the model passes validation.', 'OnSubmit fires always — you validate manually via EditContext.Validate().', 'Provide `Model=` for simple cases; `EditContext=` when you need programmatic control.']
    },
    {
      heading: 'Built-in input components',
      points: ['Blazor ships typed input components: InputText, InputTextArea, InputNumber<T>, InputSelect<T>, InputCheckbox, InputDate<T>, InputRadio<T>, and InputFile. All integrate with EditContext out of the box — they mark fields as modified on change and participate in validation. Always prefer these over raw <input> elements inside EditForm.',
      'Built-in inputs integrate with EditContext automatically.', 'InputNumber<T> handles parsing and displays a validation error on invalid input.', 'InputFile is for file uploads — it does not bind to a string.', 'Raw <input> elements bypass the EditContext tracking.']
    },
    {
      heading: 'Static SSR forms and Antiforgery',
      points: ['In .NET 8, Static SSR forms use `method="post"` and a `@formname` attribute. Blazor automatically injects an antiforgery token — you do not need `Html.AntiForgeryToken()`. Use `[SupplyParameterFromForm]` to bind the posted model. This requires a named EditForm with `FormName=` matching the `@formname`.',
      'Static SSR forms use @formname and method="post".', '[SupplyParameterFromForm] binds POST values to a property.', 'Antiforgery tokens are injected automatically in .NET 8.', 'Interactive forms work as they did pre-.NET 8 — no @formname needed.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic validated form',
      language: 'csharp',
      code: `@rendermode InteractiveServer

<EditForm Model="model" OnValidSubmit="Submit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <label>Name</label>
    <InputText @bind-Value="model.Name" />
    <ValidationMessage For="() => model.Name" />

    <label>Age</label>
    <InputNumber @bind-Value="model.Age" />
    <ValidationMessage For="() => model.Age" />

    <button type="submit">Save</button>
</EditForm>
@if (submitted) { <p>Saved!</p> }

@code {
    private UserModel model = new();
    private bool submitted;

    private void Submit()
    {
        submitted = true;
        // persist model...
    }
}

public class UserModel
{
    [Required] [MinLength(2)] public string Name { get; set; } = "";
    [Range(1, 120)] public int Age { get; set; }
}`
    },
    {
      label: 'Static SSR form (.NET 8)',
      language: 'csharp',
      code: `@page "/contact"

<EditForm FormName="contact" Model="model" method="post"
          OnValidSubmit="Submit">
    <DataAnnotationsValidator />
    <InputText @bind-Value="model.Message" />
    <ValidationMessage For="() => model.Message" />
    <button type="submit">Send</button>
</EditForm>
@if (sent) { <p>Message sent!</p> }

@code {
    [SupplyParameterFromForm]
    private ContactModel model { get; set; } = new();
    private bool sent;

    private void Submit() { sent = true; }
}

public class ContactModel
{
    [Required] public string Message { get; set; } = "";
}`
    },
    {
      label: 'Programmatic EditContext',
      language: 'csharp',
      code: `@code {
    private RegisterModel model = new();
    private EditContext ctx = default!;
    private ValidationMessageStore msgs = default!;

    protected override void OnInitialized()
    {
        ctx  = new EditContext(model);
        msgs = new ValidationMessageStore(ctx);
    }

    private async Task Submit()
    {
        msgs.Clear();
        if (!ctx.Validate()) return; // DataAnnotations pass

        bool taken = await UserService.IsEmailTakenAsync(model.Email);
        if (taken)
        {
            msgs.Add(() => model.Email, "Email already registered.");
            ctx.NotifyValidationStateChanged();
            return;
        }
        // register user...
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using OnSubmit instead of OnValidSubmit',
      wrong: '<EditForm OnSubmit="Save">',
      right: '<EditForm OnValidSubmit="Save">',
      explanation: 'OnSubmit fires regardless of validation. OnValidSubmit only fires when DataAnnotationsValidator passes — you rarely need OnSubmit.'
    },
    {
      title: 'Raw <input> inside EditForm losing validation',
      wrong: '<input type="text" @bind="model.Name" />',
      right: '<InputText @bind-Value="model.Name" />',
      explanation: 'Raw <input> does not register with the EditContext. It will not show validation messages and will not mark the field as modified.'
    },
    {
      title: 'Forgetting DataAnnotationsValidator',
      wrong: '<EditForm Model="model" OnValidSubmit="Save">\n    <!-- no validator -->\n</EditForm>',
      right: '<EditForm Model="model" OnValidSubmit="Save">\n    <DataAnnotationsValidator />\n</EditForm>',
      explanation: 'Without DataAnnotationsValidator, attribute-based rules ([Required], [Range], etc.) are never evaluated and OnValidSubmit always fires.'
    },
    {
      title: 'Using @bind instead of @bind-Value on Blazor inputs',
      wrong: '<InputText @bind="model.Name" />',
      right: '<InputText @bind-Value="model.Name" />',
      explanation: 'Blazor input components expose a Value property, so the correct directive is @bind-Value. Plain @bind targets the element\'s value attribute directly and bypasses the EditContext.'
    },
    {
      title: 'Not clearing the ValidationMessageStore before re-validation',
      wrong: 'private async Task Submit() { msgs.Add(() => model.Email, "Taken."); }',
      right: 'private async Task Submit() { msgs.Clear(); /* then re-validate */ }',
      explanation: 'Old messages accumulate on each submission attempt. Always Clear() before adding new ones.'
    },
  ];

  challenge: Challenge = {
    title: 'Registration Form with Server-side Email Check',
    language: 'csharp',
    description: 'Build a registration form with Name, Email, and Password fields. Use DataAnnotations for client-side rules. After DataAnnotations pass, check if the email is already taken (simulate with a hardcoded set). Show a field-level error if taken. Show a success message on valid submission.',
    hints: [
      'Use OnSubmit (not OnValidSubmit) so you can run custom checks after DataAnnotations.',
      'Or use OnValidSubmit and a ValidationMessageStore for the server-side error.',
      'Call ctx.NotifyValidationStateChanged() after adding a message.',
    ],
    starterCode: `public class RegisterModel
{
    [Required] public string Name { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(8)] public string Password { get; set; } = "";
}

// TODO: build the EditForm with validation`,
    solution: `@rendermode InteractiveServer
@code {
    private static readonly HashSet<string> TakenEmails = ["admin@example.com", "test@test.com"];
    private RegisterModel model = new();
    private EditContext ctx = default!;
    private ValidationMessageStore msgs = default!;
    private bool success;

    protected override void OnInitialized()
    {
        ctx = new EditContext(model);
        msgs = new ValidationMessageStore(ctx);
    }

    private void Submit()
    {
        msgs.Clear();
        if (!ctx.Validate()) return;
        if (TakenEmails.Contains(model.Email))
        {
            msgs.Add(() => model.Email, "Email is already registered.");
            ctx.NotifyValidationStateChanged();
            return;
        }
        success = true;
    }
}
<EditForm EditContext="ctx" OnSubmit="Submit">
    <DataAnnotationsValidator />
    <InputText @bind-Value="model.Name" /><ValidationMessage For="() => model.Name" />
    <InputText @bind-Value="model.Email" /><ValidationMessage For="() => model.Email" />
    <InputText @bind-Value="model.Password" /><ValidationMessage For="() => model.Password" />
    <button type="submit">Register</button>
</EditForm>
@if (success) { <p>Registered successfully!</p> }`
  };

  quiz: QuizQuestion[] = [
    { q: 'Which event fires only when validation succeeds?', options: ['OnSubmit', 'OnValidSubmit', 'OnSuccess', 'OnFormValid'], answer: 1, explanation: 'OnValidSubmit is conditional on DataAnnotationsValidator passing. OnSubmit fires regardless of validation state.' },
    { q: 'What is EditContext used for?', options: ['Styling the form', 'Tracking modified fields and validation state', 'Submitting to an API', 'Defining CSS classes'], answer: 1, explanation: 'EditContext is the model tracker for an EditForm — it knows which fields are dirty and holds all validation messages.' },
    { q: 'Which input component is correct inside EditForm for a string property?', options: ['<input type="text" @bind>', '<InputText @bind-Value>', '<TextInput @bind>', '<input @bind-Value>'], answer: 1, explanation: 'InputText is Blazor\'s built-in string input that integrates with EditContext. @bind-Value is the correct directive for Blazor input components.' },
    { q: 'In .NET 8 Static SSR forms, what attribute binds a POST value to a property?', options: ['[FormField]', '[FromForm]', '[SupplyParameterFromForm]', '[BindFromForm]'], answer: 2, explanation: '[SupplyParameterFromForm] is the .NET 8 attribute that maps form POST values to a component property in Static SSR.' },
    { q: 'After adding a message to ValidationMessageStore, what must you call?', options: ['StateHasChanged()', 'ctx.NotifyValidationStateChanged()', 'msgs.Flush()', 'ctx.Refresh()'], answer: 1, explanation: 'ctx.NotifyValidationStateChanged() signals Blazor to re-render the validation UI after messages are added programmatically.' },
    { q: 'How do you validate a nested object graph with DataAnnotations in EditForm?', options: ['DataAnnotations validates nested objects automatically', 'Use [ValidateComplexType] on the parent property and add <ObjectGraphDataAnnotationsValidator> instead of <DataAnnotationsValidator>', 'Use nested EditForm components', 'Use FluentValidation only'], answer: 1, explanation: 'The default DataAnnotationsValidator only validates the root model — it skips properties that are complex objects. Replace it with ObjectGraphDataAnnotationsValidator from Microsoft.AspNetCore.Components.DataAnnotations.Validation and add [ValidateComplexType] on nested object properties to enable deep validation.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I always use EditForm or can I use a plain <form>?', a: 'Use EditForm whenever you need validation, field tracking, or built-in input components. A plain <form> is acceptable for simple Static SSR pages where you only need a POST action and no client-side validation.' },
    { q: 'How do I reset a form?', a: 'Replace the model instance with a new one and recreate the EditContext: `model = new(); ctx = new EditContext(model); msgs = new ValidationMessageStore(ctx);`. This clears all validation state and field values.' },
    { q: 'Can I use FluentValidation instead of DataAnnotations?', a: 'Yes. Install the Blazor.FluentValidation NuGet package and replace DataAnnotationsValidator with FluentValidationValidator. The EditContext and ValidationMessage components work the same way.' },
    { q: 'How does @bind-Value differ from @bind on Blazor input components?', a: '@bind-Value is the correct directive for Blazor input components (InputText, InputNumber, etc.) — it binds to the component\'s Value parameter. @bind on a raw HTML element binds to the element\'s value attribute and bypasses EditContext tracking.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor forms are built with EditForm + DataAnnotationsValidator — the EditContext tracks field state and validation, and built-in input components (InputText, InputNumber…) integrate automatically.',
    mustKnow: [
      'EditForm wraps a model in an EditContext for validation tracking.',
      'DataAnnotationsValidator wires DataAnnotations rules to the form.',
      'OnValidSubmit fires only when validation passes; OnSubmit always fires.',
      'Use @bind-Value (not @bind) on Blazor input components.',
      '[SupplyParameterFromForm] binds POST data in .NET 8 Static SSR forms.',
      'ValidationMessageStore enables adding server-side errors programmatically.',
    ],
    interviewFocus: [
      'What is the difference between OnSubmit and OnValidSubmit?',
      'How do you add custom server-side validation errors to a Blazor form?',
      'How do Static SSR forms differ from interactive forms in .NET 8?',
    ]
  };
}
