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
  selector: 'app-blazor-data-binding',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './data-binding.html',
  styleUrl: './data-binding.scss'
})
export class BlazorDataBinding {
  quickRef: QuickRefItem[] = [
    { name: '@value', type: 'syntax', desc: 'One-way expression binding — renders a C# value into HTML.' },
    { name: '@bind', type: 'syntax', desc: 'Two-way binding shorthand (sets value and wires the change event).' },
    { name: '@bind-Value', type: 'syntax', desc: 'Two-way bind on Blazor input component\'s Value parameter.' },
    { name: '@bind:event="oninput"', type: 'syntax', desc: 'Triggers binding on the oninput event instead of onchange.' },
    { name: '@bind:format', type: 'syntax', desc: 'Format string for date/number two-way binding.' },
    { name: '@onclick', type: 'syntax', desc: 'Binds a C# method or lambda to the click event.' },
    { name: '@oninput', type: 'syntax', desc: 'Fires on every keystroke — use for live search.' },
    { name: '@onchange', type: 'syntax', desc: 'Fires when the element loses focus after a change.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'One-way binding',
      points: ['In Blazor, `@expression` renders a C# value into the HTML output. This is strictly one-way — changing the rendered HTML (in the browser) does not update the C# field. Use it for read-only display: `<p>@user.Name</p>`. Blazor re-renders the component whenever it re-runs the render tree, updating the DOM diff.',
      '@expression emits HTML from a C# value.', 'No DOM changes feed back to C# in one-way binding.', 'Re-rendering on state change updates all @expression values.', 'Use for display — labels, text, class names, styles.']
    },
    {
      heading: 'Two-way binding with @bind',
      points: ['`@bind` is syntactic sugar that combines reading a property and subscribing to its change event. On a native `<input>`, `@bind="text"` expands to `value="@text" @onchange="e => text = e.Value.ToString()"`. The default trigger is `onchange` (fires on blur). Switch to `oninput` for real-time updates: `@bind:event="oninput"`.',
      '@bind = @value + @onchange wired together.', 'Default event is onchange (fires on blur).', '@bind:event="oninput" fires on every keystroke.', '@bind:format controls display of dates and numbers.']
    },
    {
      heading: 'Event binding and lambda arguments',
      points: ['Event directives like `@onclick`, `@oninput`, and `@onkeydown` accept a method reference or a lambda. Event args are available as `MouseEventArgs`, `ChangeEventArgs`, `KeyboardEventArgs`, etc. Modern Razor codegen matches C#\'s own per-iteration `foreach` capture semantics, so a lambda like `@onclick="() => Select(item)"` inside `@foreach` correctly captures that iteration\'s own item — add `@key` on the rendered element instead when the underlying list can be reordered or filtered.',
      'Event directives accept method references or lambdas.', 'Event arg types: MouseEventArgs, ChangeEventArgs, KeyboardEventArgs, etc.', '@key="item.Id" keeps component state correctly attached when a list is reordered or filtered.', 'async lambdas are fine: @onclick="async () => await Load()"']
    },
    {
      heading: 'Custom Component Two-Way Binding with @bind-Value',
      points: [
        'Creating a custom component that supports @bind-Value (the same syntax used with built-in input elements) requires exposing a Value parameter and a matching ValueChanged EventCallback<T> parameter, following Blazor\'s naming convention that pairs a parameter with a ParameterChanged callback.',
        'The consuming component then binds with <MyCustomInput @bind-Value="myField" /> — Blazor automatically wires this to pass myField as Value and update myField whenever ValueChanged fires, without the consumer needing to manually write out the equivalent Value and ValueChanged wiring explicitly.',
        'For components binding a complex object rather than a simple primitive, consider whether two-way binding is even the right pattern — sometimes explicit, one-directional parameter passing plus an explicit "save" callback better expresses the actual intended interaction than implicit continuous two-way synchronization.',
        'Binding expressions can include format strings for certain types (@bind:format="yyyy-MM-dd" for dates) — controlling how a bound value is displayed and parsed without needing separate manual formatting logic in the component.',
      ],
    },
    {
      heading: 'Debouncing Bound Input for Performance',
      points: [
        'Binding a text input with @bind:event="oninput" for live filtering or search-as-you-type triggers an update (and potential re-render or server round-trip) on every single keystroke — for expensive downstream operations (an API call, a large list filter), this can create noticeable performance issues or excessive server load.',
        'Debouncing (waiting for a brief pause in typing before actually triggering the expensive operation) is not built into Blazor\'s binding system directly and typically requires a small amount of custom logic — a Timer or Task.Delay-based debounce wrapper around the bound value\'s change handler.',
        'In Blazor Server specifically, un-debounced binding on a fast typist sends a SignalR message to the server for every keystroke — debouncing here has a doubly important benefit, reducing both unnecessary re-render work AND unnecessary network round-trips over the circuit.',
        'Libraries and community components exist specifically to provide debounced input components as a drop-in replacement for standard bound inputs, avoiding the need to hand-roll debounce logic repeatedly across different parts of an application that need this same behavior.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One-way & events',
      language: 'csharp',
      code: `@rendermode InteractiveServer

<p>Count: @count</p>
<button @onclick="Increment">+1</button>
<button @onclick="() => count = 0">Reset</button>

@code {
    private int count = 0;
    private void Increment() => count++;
}`
    },
    {
      label: 'Two-way @bind',
      language: 'csharp',
      code: `<input @bind="name" />
<p>Hello, @name!</p>

<!-- Live update on each keystroke -->
<input @bind="search" @bind:event="oninput" />
<p>Searching: @search</p>

<!-- Date with format -->
<input type="date" @bind="dob" @bind:format="yyyy-MM-dd" />
<p>DOB: @dob.ToShortDateString()</p>

@code {
    private string name = "";
    private string search = "";
    private DateTime dob = DateTime.Today;
}`
    },
    {
      label: '@key on a reorderable list',
      language: 'csharp',
      code: `@foreach (var item in items)
{
    <!-- @key="item.Id" gives Blazor a stable identity to diff by —
         without it, reordering "items" can reassign DOM state
         (input focus, CSS transitions) to the wrong element. -->
    <button @key="item.Id" @onclick="() => Select(item)">
        @item.Name
    </button>
}

@code {
    record Product(int Id, string Name);
    private List<Product> items = [new(1,"A"), new(2,"B"), new(3,"C")];
    private Product? selected;
    private void Select(Product p) => selected = p;
    // The lambda above correctly captures EACH iteration's own
    // "item" — modern Razor codegen matches C#'s per-iteration
    // foreach capture semantics, so this needs no local-variable
    // workaround.
}`
    },
    {
      label: '@bind on component',
      language: 'csharp',
      code: `<!-- Child: NumberInput.razor -->
<input type="number" value="@Value"
       @onchange="e => ValueChanged.InvokeAsync(int.Parse(e.Value!.ToString()!))" />
@code {
    [Parameter] public int Value { get; set; }
    [Parameter] public EventCallback<int> ValueChanged { get; set; }
}

<!-- Parent — @bind-Value wires up ValueChanged automatically -->
<NumberInput @bind-Value="qty" />
<p>Quantity: @qty</p>
@code { private int qty = 1; }`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @bind on a Blazor input component instead of @bind-Value',
      wrong: '<InputText @bind="model.Name" />',
      right: '<InputText @bind-Value="model.Name" />',
      explanation: 'Blazor input components (InputText, InputNumber, etc.) expose a Value parameter. @bind targets an element attribute; @bind-Value targets the component parameter.'
    },
    {
      title: 'Rendering a list without @key when it can be reordered or filtered',
      wrong: '@foreach (var item in items) { <ItemRow Data="item" /> }',
      right: '@foreach (var item in items) { <ItemRow @key="item.Id" Data="item" /> }',
      explanation: 'Without @key, Blazor\'s diffing algorithm matches old and new render output by POSITION, not identity. If items are reordered, filtered, or spliced, component instances (and any state or focus they hold) can get reassigned to the wrong data. @key="item.Id" tells Blazor to track each element by its own stable identity across renders.'
    },
    {
      title: 'Using @oninput on an EditForm field expecting onchange',
      wrong: '<input @bind="model.Name" @bind:event="oninput" />  // inside EditForm',
      right: '<InputText @bind-Value="model.Name" />  // EditContext tracks on change by default',
      explanation: 'Mixing @bind:event="oninput" with EditContext can cause premature validation messages on every keystroke. Use the built-in input components which trigger at the right time.'
    },
    {
      title: 'Modifying a bound property inside OnChange',
      wrong: '@onchange="e => { name = e.Value.ToString(); name = name.Trim(); }"',
      right: '@bind="name" // then: private string name { get => _n; set => _n = value.Trim(); }',
      explanation: 'Computed setter logic belongs in the property setter, not the event handler. Mixing mutation in the event handler while @bind is active can cause double-render issues.'
    },
    {
      title: 'Two-way binding async lambdas without await',
      wrong: '@onclick="async () => Load()"',
      right: '@onclick="async () => await Load()"',
      explanation: 'Without await, exceptions from Load() are silently swallowed. Always await async operations in event handlers.'
    },
  ];

  challenge: Challenge = {
    title: 'Live Character Counter Input',
    language: 'csharp',
    description: 'Build a textarea with a live character counter. Show "X / 200 characters" below it, updating on every keystroke. Turn the counter red when the limit is exceeded. Disable the submit button when over the limit or when the textarea is empty.',
    hints: [
      'Use @bind:event="oninput" on the textarea for live updates.',
      'Compare text.Length to the limit inside the component.',
      'Bind the disabled attribute: `<button disabled="@IsDisabled">`.',
    ],
    starterCode: `@rendermode InteractiveServer

<textarea @bind="text" @bind:event="oninput" maxlength="250"></textarea>
<p>@text.Length / 200</p>
<button>Submit</button>

@code {
    private string text = "";
    // TODO: limit, color, disabled logic
}`,
    solution: `@rendermode InteractiveServer

<textarea @bind="text" @bind:event="oninput"></textarea>
<p style="color: @(IsOver ? "red" : "inherit")">@text.Length / @Limit characters</p>
<button disabled="@(IsDisabled)">Submit</button>

@code {
    private const int Limit = 200;
    private string text = "";
    private bool IsOver => text.Length > Limit;
    private bool IsDisabled => text.Length == 0 || IsOver;
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does @bind expand to on a native <input>?', options: ['Only @onchange', 'value="@x" + @onchange that sets x', '@oninput + @value', 'Just @value'], answer: 1, explanation: '@bind is syntactic sugar for setting the value attribute and subscribing to the change event that updates the bound field.' },
    { q: 'Which event is triggered by @bind:event="oninput"?', options: ['On blur', 'On form submit', 'On every keystroke', 'On enter key'], answer: 2, explanation: 'oninput fires synchronously on every character input, making it suitable for live search or character counters.' },
    { q: 'What does the @key directive prevent when rendering a @foreach list in Blazor?', options: ['Duplicate keys in a dictionary', 'Blazor misattributing component state/DOM elements when the list is reordered, filtered, or spliced', 'The foreach loop variable capture bug', 'CSS class name collisions'], answer: 1, explanation: '@key tells Blazor\'s diffing algorithm to match old and new render output by a stable identity instead of by position. Without it, reordering or filtering a list can reassign component state (like input focus) to the wrong underlying data.' },
    { q: 'What attribute is used for two-way binding on Blazor InputText?', options: ['@bind', '@bind-Value', '@twoway', '@model'], answer: 1, explanation: '@bind-Value targets the Value parameter of Blazor input components. @bind targets the native HTML element\'s value attribute.' },
    { q: 'What should you always do with async event lambdas?', options: ['Return void', 'Use async and await', 'Suppress warnings', 'Run on background thread'], answer: 1, explanation: 'Always await async calls in event handlers to ensure exceptions are not silently swallowed and state is updated correctly.' },
    { q: 'How do you set the format string for date inputs with @bind?', options: ['@bind-format="yyyy-MM-dd"', '@bind:format="yyyy-MM-dd"', 'format="yyyy-MM-dd"', 'Use a custom converter'], answer: 1, explanation: '@bind:format="yyyy-MM-dd" on an <input type="date"> tells Blazor how to parse and format the DateTime. Without it, browsers and locales may parse dates differently, causing silent null/wrong-value bugs.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between @onchange and @oninput on a text field?', a: '@onchange fires when the element loses focus after its value changed (traditional DOM change event). @oninput fires on every keystroke. Use @oninput for live feedback; @onchange for less aggressive updates that are validated on blur.' },
    { q: 'Can I use @bind on a custom component I wrote?', a: 'Yes. @bind-PropName synthesizes a PropNameChanged EventCallback. Declare both `[Parameter] public T PropName` and `[Parameter] public EventCallback<T> PropNameChanged` on your component, and parents can use `@bind-PropName="field"`.' },
    { q: 'When does Blazor re-render after an event?', a: 'Blazor calls StateHasChanged automatically after every event handler completes. If the handler is async, a re-render happens after each awaited continuation too. You rarely need to call StateHasChanged manually from event handlers.' },
    { q: 'How do I bind a nullable property?', a: 'Blazor input components support nullable generics: `InputNumber<int?>` binds to `int?`. For string properties, string is already nullable by reference. Ensure validation accounts for null with [Required] or nullability annotations.' },
    { q: 'What is the difference between one-way binding (@value) and two-way binding (@bind) in Blazor?',
      a: 'One-way binding (value="@field") only flows data FROM the component\'s C# state TO the rendered HTML element — user input into that element does not automatically update the underlying field. Two-way binding (@bind="field") additionally wires up an event handler (oninput or onchange depending on the bind modifier) so that user changes to the element flow back and update the C# field automatically, keeping both in sync without manually writing the event handler yourself.' },
    { q: 'How does @bind:event let you customize when a two-way bound value updates?',
      a: 'By default, @bind="field" on a text input uses the onchange event, which only fires when the input loses focus, not on every keystroke. Adding @bind:event="oninput" changes the bound event to oninput, updating the underlying field on every keystroke instead — useful for live character counters, search-as-you-type filtering, or any UI that needs to react immediately rather than waiting for the field to lose focus.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor binding: @expression for one-way display, @bind for two-way (expands to value + onchange), and @onclick/@oninput for event handling — all automatically triggering re-renders.',
    mustKnow: [
      '@expression renders a C# value one-way into HTML.',
      '@bind = value attribute + onchange event; default trigger is blur.',
      '@bind:event="oninput" fires on every keystroke for live updates.',
      '@bind-Value is for Blazor input components (InputText, InputNumber…).',
      'Capture foreach variables to locals to avoid the closure trap.',
      'Always await async lambdas in event handlers.',
    ],
    interviewFocus: [
      'What does @bind expand to on a native input element?',
      'How do you implement two-way binding on a custom component?',
      'Why must you capture foreach variables to locals in Blazor event handlers?',
    ]
  };
}
