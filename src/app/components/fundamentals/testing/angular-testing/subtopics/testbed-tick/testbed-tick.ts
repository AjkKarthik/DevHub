import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-testbed-tick',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './testbed-tick.html',
  styleUrl: './testbed-tick.scss'
})
export class TestBedTickSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From the Angular 22 type definitions",
      "points": [
        "<code>@angular/core/testing</code> in Angular 22 documents <code>flushEffects()</code> as \"Execute any pending effects\" with <code>@deprecated use TestBed.tick() instead</code>.",
        "Right below it, <code>tick()</code> is documented as \"Execute any pending work required to synchronize model to the UI\", marked <code>@publicApi 20.0</code>.",
        "The difference matters for effects that write to the DOM or to signals read by templates: <code>tick()</code> covers both the effects and the change detection that follows, matching what the application itself does.",
        "The page's theory bullet and its effects QnA now name <code>TestBed.tick()</code> and mention <code>flushEffects()</code> only as the deprecated older API."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Effect test",
      "language": "typescript",
      "code": "it('saves the draft when the title changes', () => {\n  const fixture = TestBed.createComponent(EditorComponent);\n  const storage = TestBed.inject(DraftStorage);\n  const save = jest.spyOn(storage, 'save');\n\n  fixture.componentInstance.title.set('Hello');\n  TestBed.tick();                        // run effects + sync the UI\n\n  expect(save).toHaveBeenCalledWith({ title: 'Hello' });\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test sets a signal and immediately asserts that an effect called a spy, with no flushing call in between. Why does it fail?",
    "hint": "Effects are scheduled, not run synchronously when a signal changes.",
    "solution": "Setting a signal only marks the effect as dirty; Angular runs it later as part of its scheduling. Without TestBed.tick() (or a change detection pass that runs effects) the spy has not been called yet when the assertion runs."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Effects run synchronously when the signal is set.",
      "reality": "They are scheduled. Tests have to let Angular run them, which is what TestBed.tick() does."
    },
    {
      "thought": "flushEffects() and tick() are identical.",
      "reality": "tick() also synchronises the UI; flushEffects() only ran effects and is now deprecated."
    }
  ];
}
