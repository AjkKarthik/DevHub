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
  templateUrl: './key-prevents-blazor-from-misattributing-state-when-a-list-reorders.html',
  styleUrl: './key-prevents-blazor-from-misattributing-state-when-a-list-reorders.scss'
})
export class KeyPreventsBlazorFromMisattributingStateWhenAListReordersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Without @key, Blazor\'s diffing matches old and new render output by POSITION, not by identity',
      points: [
        'When a @foreach block re-renders (because the underlying list changed — an item was added, removed, filtered out, or reordered), Blazor needs to figure out which OLD rendered element corresponds to which NEW one, so it can patch the DOM efficiently instead of tearing everything down and rebuilding it from scratch.',
        'By default, without @key, this matching happens PURELY by position in the render sequence — the 3rd rendered element in the old output is matched against the 3rd rendered element in the new output, regardless of whether they represent the SAME underlying data item or a completely different one that simply happens to now be in that position.',
      ]
    },
    {
      heading: 'The practical consequence: component state (and DOM state like input focus) can get silently reassigned to the wrong item',
      points: [
        'If a component in the list holds its OWN internal state (an expanded/collapsed flag, an in-progress edit buffer, the browser\'s own input focus), position-based matching means that state stays attached to WHATEVER item now occupies that position after a reorder — not the item it was originally associated with.',
        '@key="item.Id" (or any other stable, unique identifier) tells Blazor\'s diffing algorithm to match elements by that identity instead of position — an item that moved from position 3 to position 1 is still correctly recognized as the SAME item, and its component instance (with all its internal state) moves WITH it, rather than being left behind for whatever now occupies position 3.',
        'This is a genuinely different problem from a lambda closure bug — it is about which DOM/component INSTANCE gets reused across a re-render, not about which value a captured variable happens to hold. The fix (@key) and the failure mode (state on the wrong row) are both specific to Blazor\'s rendering/diffing algorithm, not a C# language-level closure issue.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without @key — state can end up on the wrong row',
      language: 'csharp',
      code: `@foreach (var todo in todos)
{
    <!-- No @key — Blazor matches this <TodoRow> by POSITION only -->
    <TodoRow Item="todo" />
}

@code {
    private List<TodoItem> todos = LoadTodos();

    private void RemoveFirst()
    {
        // Removing the FIRST item shifts every remaining item's
        // POSITION down by one. Without @key, Blazor's diffing sees
        // "the 2nd rendered row now has different data" and PATCHES
        // that row's existing component instance in place — but any
        // internal state that TodoRow instance was holding (e.g. an
        // "is this row's edit textbox focused/expanded" flag) stays
        // attached to that POSITION, not to the todo item it was
        // originally showing.
        todos.RemoveAt(0);
    }
}`,
    },
    {
      label: 'With @key — state correctly follows the item',
      language: 'csharp',
      code: `@foreach (var todo in todos)
{
    <!-- @key="todo.Id" — Blazor now matches by STABLE IDENTITY -->
    <TodoRow @key="todo.Id" Item="todo" />
}

@code {
    private List<TodoItem> todos = LoadTodos();

    private void RemoveFirst()
    {
        // Same removal as before — but now every remaining
        // TodoRow's own component instance is matched by its Id,
        // not its position. Each row's internal state (expanded,
        // focused, mid-edit) correctly stays attached to the SAME
        // todo item it was always showing, even though that item's
        // POSITION in the rendered list just shifted.
        todos.RemoveAt(0);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds a sortable table where clicking a column header re-sorts the underlying list. After sorting by name, a user who had expanded row 3\'s detail panel notices the WRONG row now appears expanded. The team initially suspects a state-management bug in their expand/collapse logic. What is the more likely root cause, based on this subtopic?',
    hint: 'Think about what changed about the list itself when it was re-sorted — did any ROW\'S OWN DATA actually change, or did the ORDER of existing rows change? And is @key present on the rendered rows?',
    solution: 'The more likely root cause is a missing @key on the rendered row elements/components, not a bug in the expand/collapse state logic itself. Sorting does not change any row\'s underlying data — it changes the ORDER the same items are rendered in. Without @key, Blazor\'s diffing matches the old and new render output purely by position: row 3\'s component instance (holding the "expanded" state) gets reused for WHATEVER item now occupies position 3 after sorting, not for the original item that was actually expanded. Adding @key="item.Id" (or whatever stable identifier the row data has) to each rendered row fixes this directly — Blazor then matches by identity, so each row\'s expanded/collapsed state correctly travels WITH its own item regardless of where sorting moves it to.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor automatically tracks which rendered element corresponds to which underlying data item, using something like the item\'s own equality or a computed diff — @key is just an optional performance hint.',
      reality: 'Without @key, Blazor matches purely by POSITION in the render sequence, confirmed in this subtopic\'s first code example — an item\'s component state genuinely gets reassigned to whatever occupies its old position after a reorder, not tracked by the item\'s own identity or equality at all. @key is a correctness fix for this specific failure mode, not merely a performance optimization.'
    },
    {
      thought: 'The "wrong data showing in the wrong row after a list changes" symptom described in this subtopic is the same underlying issue as the classic foreach-loop-variable-capture closure bug.',
      reality: 'These are two unrelated mechanisms with a superficially similar symptom — the closure-capture issue (a C# language-level concern about which variable a lambda references) has been correctly handled by Razor\'s foreach codegen matching C#\'s own per-iteration capture semantics since C# 5.0; the @key issue described here is entirely about Blazor\'s DIFFING algorithm deciding which component INSTANCE to reuse across a re-render, a completely separate rendering-layer concern.'
    },
    {
      thought: '@key is only relevant for lists that display differently-typed or visually distinct items — a list of visually simple, uniform rows does not need it.',
      reality: 'The risk this subtopic describes has nothing to do with visual complexity — it is about whether any component in the list holds INTERNAL STATE (focus, an expanded flag, an in-progress edit) that could get misattributed across a reorder. Even visually simple rows need @key if their underlying list can be reordered, filtered, or spliced while any row retains meaningful internal state.'
    }
  ];
}
