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
  templateUrl: './notifyvalidationstatechanged-is-required-editcontext-cant-see-msgstore-adds.html',
  styleUrl: './notifyvalidationstatechanged-is-required-editcontext-cant-see-msgstore-adds.scss'
})
export class NotifyvalidationstatechangedIsRequiredEditcontextCantSeeMsgstoreAddsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ValidationMessageStore is a plain data structure — it has no way to tell EditContext or the UI that it changed',
      points: [
        'The main page\'s code samples always call ctx.NotifyValidationStateChanged() right after msgs.Add(...), but it is easy to treat that call as boilerplate rather than understand why it is genuinely required: ValidationMessageStore is just a dictionary-like collection of messages keyed by field — adding to it is a plain in-memory mutation with no observer pattern, no event, and no connection back to EditContext\'s own rendering pipeline.',
        'ValidationSummary and ValidationMessage components do not poll ValidationMessageStore directly on every render — they subscribe to EditContext\'s OnValidationStateChanged EVENT, and only re-read the current messages when that event fires. NotifyValidationStateChanged() is the ONLY thing that raises that event — without calling it, the newly-added message exists in memory but nothing in the UI has been told to go look for it.',
      ]
    },
    {
      heading: 'Why the Blazor re-render pipeline alone does not save you here',
      points: [
        'A component calling StateHasChanged() after adding a message will indeed cause a general re-render of that component\'s own markup — but ValidationSummary and ValidationMessage are typically SEPARATE components elsewhere in the tree, and Blazor\'s ordinary re-render does not automatically re-query EditContext\'s validation state on every unrelated re-render; it specifically waits for the OnValidationStateChanged event.',
        'This means calling only StateHasChanged() (without NotifyValidationStateChanged()) can appear to "almost work" in some layouts — the form might re-render for unrelated reasons and coincidentally reflect the new message — while being fundamentally unreliable, since nothing is actually guaranteed to trigger ValidationSummary\'s own refresh without the correct event.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Missing NotifyValidationStateChanged — the message never appears',
      language: 'csharp',
      code: `private async Task Submit()
{
    msgs.Clear();
    if (!ctx.Validate()) return;

    bool taken = await UserService.IsEmailTakenAsync(model.Email);
    if (taken)
    {
        msgs.Add(() => model.Email, "Email already registered.");
        // BUG: the message is now in msgs, but ValidationSummary and
        // ValidationMessage components have NOT been told anything
        // changed — they will keep showing whatever they last showed
        // (nothing), even though the ValidationMessageStore genuinely
        // contains a new entry right now.
        return;
    }
    // register user...
}`,
    },
    {
      label: 'The correct call — NotifyValidationStateChanged raises the event',
      language: 'csharp',
      code: `private async Task Submit()
{
    msgs.Clear();
    if (!ctx.Validate()) return;

    bool taken = await UserService.IsEmailTakenAsync(model.Email);
    if (taken)
    {
        msgs.Add(() => model.Email, "Email already registered.");

        // This raises EditContext's OnValidationStateChanged event —
        // the ONLY thing ValidationSummary/ValidationMessage actually
        // listen for. Without this call, the message added above is
        // invisible to the UI no matter how many other re-renders
        // happen elsewhere in the component tree.
        ctx.NotifyValidationStateChanged();
        return;
    }
    // register user...
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds a server-side validation message via ValidationMessageStore, forgets to call NotifyValidationStateChanged(), but the message DOES show up correctly in their testing. They conclude the call must be optional in their case. Later, in a slightly different part of the app, the identical pattern silently fails to show the message. What is the most likely explanation for the inconsistent behavior?',
    hint: 'Think about what ELSE might have coincidentally triggered a refresh of the ValidationSummary component in the first case — something unrelated to the missing NotifyValidationStateChanged() call itself.',
    solution: 'The most likely explanation is that something else in the first scenario coincidentally caused ValidationSummary (or the whole page) to re-render in a way that happened to re-read the current validation state — for example, if the Submit method\'s own component re-rendered via its normal @onclick dispatch AND ValidationSummary happened to be positioned somewhere that got recreated rather than merely patched, it could pick up the new message by accident. This is exactly why relying on incidental re-renders is unreliable: NotifyValidationStateChanged() is the ONLY guaranteed, correct way to signal a validation state change, since it raises the specific event ValidationSummary and ValidationMessage actually subscribe to. Any scenario where it "seems to work" without that call is coincidental to the specific component layout, not a sign the call is genuinely optional — the second, differently-structured part of the app simply did not have the same lucky coincidence.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ctx.NotifyValidationStateChanged() is largely a formality or best-practice convention — ValidationSummary and ValidationMessage will pick up new messages on the next render regardless, since they read from the same EditContext.',
      reality: 'ValidationSummary and ValidationMessage specifically subscribe to EditContext\'s OnValidationStateChanged EVENT, not a general "re-read on every render" mechanism — confirmed in this subtopic\'s first code example, where a message added without calling NotifyValidationStateChanged() genuinely never appears in the UI, regardless of other re-renders happening elsewhere.'
    },
    {
      thought: 'Calling StateHasChanged() on the component that added the validation message is functionally equivalent to calling ctx.NotifyValidationStateChanged(), since both trigger some form of re-render.',
      reality: 'These are different mechanisms entirely — StateHasChanged() re-renders the CALLING component\'s own markup, while NotifyValidationStateChanged() raises EditContext\'s specific validation-state event that ValidationSummary/ValidationMessage (often SEPARATE components elsewhere in the tree) actually listen for. Calling only StateHasChanged() does not reliably update validation UI that lives in a different component.'
    },
    {
      thought: 'ValidationMessageStore automatically integrates with EditContext\'s change-tracking the same way a [Parameter] change or a form field edit does, since it was constructed with a reference to that EditContext.',
      reality: 'Being constructed with a reference to EditContext only lets ValidationMessageStore ADD messages to that context\'s message collection — it does not grant it any special event-raising behavior. Every mutation still requires an explicit NotifyValidationStateChanged() call to become visible, confirmed by the identical "silently invisible" failure mode in this subtopic\'s first example.'
    }
  ];
}
