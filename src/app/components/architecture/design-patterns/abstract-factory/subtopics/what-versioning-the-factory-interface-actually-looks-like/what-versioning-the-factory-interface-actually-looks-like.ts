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
  templateUrl: './what-versioning-the-factory-interface-actually-looks-like.html',
  styleUrl: './what-versioning-the-factory-interface-actually-looks-like.scss'
})
export class WhatVersioningTheFactoryInterfaceActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two mitigations named, neither ever shown',
      points: [
        'The page\'s own first mistake, "Adding a new product type to an existing factory," is honest about the trade-off — adding <code>IDialog CreateDialog()</code> to <code>IUiFactory</code> breaks every existing concrete factory. Its "right" side is two lines of pure comments: "Mitigate: version the factory interface or use extension methods."',
        'Both mitigations are named; neither is shown in code anywhere on the page. This subtopic writes out the first one — interface versioning — concretely.',
      ]
    },
    {
      heading: 'What "version the factory interface" actually means in practice',
      points: [
        'Instead of adding <code>CreateDialog()</code> directly to <code>IUiFactory</code> (which every existing concrete factory would then have to implement, even ones with no dialog support), define a SEPARATE, NEWER interface — <code>IUiFactoryV2</code> — that extends the original and adds only the new method.',
        'Existing concrete factories (<code>WindowsUiFactory</code>, <code>MacUiFactory</code>) are completely untouched — they still only implement <code>IUiFactory</code>, and nothing about them needs to change or even recompile.',
        'A NEW concrete factory that DOES support dialogs implements <code>IUiFactoryV2</code> instead. Client code that needs dialog support depends on <code>IUiFactoryV2</code> specifically; client code that does not need dialogs keeps depending on the original <code>IUiFactory</code> and is entirely unaffected by the new capability existing elsewhere in the codebase.',
        'The real cost this trades in: client code that WANTS the new capability has to know to ask for the newer interface, and a factory that should support both old and new clients has to implement both interfaces — this is not free, but it is a fundamentally different (and much smaller) cost than "every existing concrete factory now fails to compile."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Adding a dialog capability without breaking existing factories',
      language: 'csharp',
      code: `// ORIGINAL interface -- completely unchanged
public interface IUiFactory
{
    IButton CreateButton();
    ICheckbox CreateCheckbox();
}

// NEW interface -- extends the original, adds only the new capability
public interface IUiFactoryV2 : IUiFactory
{
    IDialog CreateDialog();
}

// EXISTING concrete factories -- zero changes, zero recompile needed
public class WindowsUiFactory : IUiFactory
{
    public IButton CreateButton() => new WinButton();
    public ICheckbox CreateCheckbox() => new WinCheckbox();
}

public class MacUiFactory : IUiFactory
{
    public IButton CreateButton() => new MacButton();
    public ICheckbox CreateCheckbox() => new MacCheckbox();
}

// A NEW factory that DOES support the new capability implements V2
public class LinuxUiFactory : IUiFactoryV2
{
    public IButton CreateButton() => new LinuxButton();
    public ICheckbox CreateCheckbox() => new LinuxCheckbox();
    public IDialog CreateDialog() => new LinuxDialog();
}

// Client code that doesn't need dialogs: unaffected, still uses IUiFactory
public class BasicApplication(IUiFactory factory)
{
    public void BuildUi()
    {
        factory.CreateButton().Render();
        factory.CreateCheckbox().Render();
    }
}

// Client code that DOES need dialogs: opts into IUiFactoryV2 specifically
public class DialogAwareApplication(IUiFactoryV2 factory)
{
    public void BuildUi()
    {
        factory.CreateButton().Render();
        factory.CreateCheckbox().Render();
        factory.CreateDialog().Render();
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate asks: "If WindowsUiFactory only implements IUiFactory, can a DialogAwareApplication ever be constructed with a WindowsUiFactory instance?"',
    hint: 'Does WindowsUiFactory implement IUiFactoryV2, or only IUiFactory?',
    solution: 'No -- DialogAwareApplication\'s constructor requires an IUiFactoryV2, and WindowsUiFactory only implements the original IUiFactory. Passing a WindowsUiFactory instance where an IUiFactoryV2 is expected is a compile error, not a runtime one -- the type system catches the mismatch immediately. To support dialogs on Windows, WindowsUiFactory itself would need to be changed to implement IUiFactoryV2 (adding a CreateDialog() method) -- versioning does not mean old factories automatically gain new capabilities for free, it means EXISTING code that does not need the new capability is not forced to change just because the capability exists somewhere else in the codebase.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Interface versioning means the original IUiFactory interface itself gets modified with a version number or flag, and every factory has to be updated to match.',
      reality: 'Per this subtopic\'s theory, the original interface stays completely unchanged — versioning means creating a SEPARATE, newer interface that extends it, so existing factories and existing client code need zero changes at all.'
    },
    {
      thought: 'Once IUiFactoryV2 exists, every concrete factory should implement it, since it is a superset of the original interface.',
      reality: 'Per this subtopic\'s theory, only factories that actually NEED to offer the new capability should implement the newer interface — WindowsUiFactory and MacUiFactory staying on the original IUiFactory, untouched, is exactly the point of this mitigation.'
    },
    {
      thought: 'Interface versioning fully eliminates the cost of adding a new product type — it is a free way around the trade-off the mistakes block describes.',
      reality: 'Per this subtopic\'s theory, it trades one cost for a smaller one — client code that wants the new capability has to specifically depend on the newer interface, and any factory supporting both old and new clients has to implement both interfaces.'
    }
  ];
}
