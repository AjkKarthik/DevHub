import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-no-getbyclassname',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './no-getbyclassname.html',
  styleUrl: './no-getbyclassname.scss'
})
export class NoGetByClassNameSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Why the method is missing",
      "points": [
        "In @testing-library/dom 10.4, <code>typeof screen.getByClassName</code> is <code>undefined</code>. The query families are ByRole, ByLabelText, ByPlaceholderText, ByText, ByDisplayValue, ByAltText, ByTitle and ByTestId.",
        "That is a design decision: the library only offers queries tied to what users or assistive technology perceive, plus test IDs as an explicit fallback. Class names are styling details.",
        "Developers who want class names reach for <code>container.querySelector(\".submit-btn\")</code>. That is the pattern the page's mistake is about, so the \"wrong\" example now shows it.",
        "The fix stays the same: <code>screen.getByRole(\"button\", { name: /submit/i })</code>, which also fails loudly if the button is missing or unlabeled."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Wrong, right, fallback",
      "language": "typescript",
      "code": "// Brittle: tied to CSS, returns null if missing\nconst { container } = render(<Form />);\ncontainer.querySelector('.submit-btn');\n\n// Preferred: accessible role and name\nscreen.getByRole('button', { name: /submit/i });\n\n// Fallback when nothing accessible fits\nscreen.getByTestId('submit');"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A designer renames <code>.submit-btn</code> to <code>.btn-primary</code>. Which of the three queries above breaks?",
    "hint": "Which ones depend on CSS?",
    "solution": "Only container.querySelector(\".submit-btn\") breaks, returning null. The role query and the test ID query do not depend on class names."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Testing Library supports every DOM lookup, including class names.",
      "reality": "It intentionally omits class and selector queries; container.querySelector is plain DOM, not a Testing Library query."
    },
    {
      "thought": "getByTestId is as good as getByRole.",
      "reality": "It is stable but says nothing about accessibility, so the docs rank it last."
    }
  ];
}
