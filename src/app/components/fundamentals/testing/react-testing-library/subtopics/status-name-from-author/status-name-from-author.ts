import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-status-name-from-author',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './status-name-from-author.html',
  styleUrl: './status-name-from-author.scss'
})
export class StatusNameFromAuthorSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Name from content versus name from author",
      "points": [
        "ARIA decides per role whether the accessible name can be computed from the element's text (\"name from content\"). Buttons, links, headings, cells and list items allow it. Live-region roles such as <code>status</code> and <code>alert</code> do not; their name comes only from <code>aria-label</code> or <code>aria-labelledby</code>.",
        "Checked with @testing-library/dom 10.4 in jsdom: for <code>&lt;div role=\"status\"&gt;Loading…&lt;/div&gt;</code>, <code>getByRole(\"status\", { name: /loading/i })</code> threw \"Unable to find an accessible element with the role status and name /loading/i\". <code>getByRole(\"status\")</code> found it, and adding <code>aria-label=\"Loading\"</code> made the named query pass. <code>role=\"alert\"</code> behaved the same.",
        "So the page's loading test only passed if <code>UserProfile</code> happened to set an <code>aria-label</code>. It now queries <code>getByRole(\"status\")</code> and asserts the text with <code>toHaveTextContent(/loading/i)</code>.",
        "The same test also returned before the mocked fetch resolved. It now awaits the heading, so the component's state update happens while the test is still running."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "document.body.innerHTML = '<div role=\"status\">Loading…</div>';\n\nscreen.getByRole('status', { name: /loading/i });\n// Error: Unable to find an accessible element with the role \"status\" and name `/loading/i`\n\nscreen.getByRole('status');                        // found\n\ndocument.body.innerHTML = '<div role=\"status\" aria-label=\"Loading\">Loading…</div>';\nscreen.getByRole('status', { name: /loading/i });  // found"
    },
    {
      "label": "Fixed test",
      "language": "typescript",
      "code": "test('shows loading state initially', async () => {\n  mockGetUser.mockResolvedValue({ id: 1, name: 'Alice' });\n  render(<UserProfile userId={1} />);\n\n  expect(screen.getByRole('status')).toHaveTextContent(/loading/i);\n\n  await screen.findByRole('heading', { name: /alice/i });\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Which of these queries find the element <code>&lt;button&gt;Save&lt;/button&gt;</code>, and which find <code>&lt;div role=\"alert\"&gt;Saved&lt;/div&gt;</code>: <code>getByRole(\"button\", { name: \"Save\" })</code> and <code>getByRole(\"alert\", { name: \"Saved\" })</code>?",
    "hint": "Which of the two roles allows name from content?",
    "solution": "The button query finds the button, because buttons take their accessible name from their text. The alert query fails, because alert names come only from aria-label or aria-labelledby. Use getByRole(\"alert\") and toHaveTextContent(\"Saved\") instead."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "The name option in getByRole matches the visible text of any element.",
      "reality": "It matches the computed accessible name, which only some roles derive from text."
    },
    {
      "thought": "A failing named query means the element is missing.",
      "reality": "The element can be present with an empty accessible name; query by role alone to check."
    }
  ];
}
