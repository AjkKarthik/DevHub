import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  standalone: true,
  imports: [TheoryBlockComponent, CodeBlockComponent, QuickRefComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './focus-management.html',
  styleUrl: './focus-management.scss'
})
export class HtmlFocusManagement {

  quickRef: QuickRefItem[] = [
    { name: 'tabindex', type: 'keyword', desc: 'Sets the tab order for an element.' },
    { name: ':focus-visible', type: 'syntax', desc: 'Applies styles when the element is focused using keyboard navigation.' },
    { name: 'focus()', type: 'method', desc: 'Programmatically focuses an element.' },
    { name: 'aria-modal', type: 'keyword', desc: 'Indicates that a dialog is modal and should be treated as such by screen readers.' },
    { name: 'skip-link', type: 'keyword', desc: 'A link to skip directly to the main content of a page for keyboard users.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Keyboard Focus',
      points: ['Elements with `tabindex` are focusable.', 'Use `tabindex="-1"` to make an element focusable but not navigable via tab key.']
    },
    {
      heading: 'Tab Index',
      points: ['Set `tabindex="0"` for elements that should be focusable by default.', 'Ensure `tabindex` is sequential and logical.']
    },
    {
      heading: 'Focus Trapping in Modals',
      points: ['Use `aria-modal="true"` on modal dialogs.', 'Trap focus within the modal using JavaScript.']
    },
    {
      heading: 'Skip Navigation Links',
      points: ['Provide skip links at the beginning of each page.', 'The link text should be descriptive and include `href="#main-content"`.']
    },
    {
      heading: 'Focus-Visible Class',
      points: ['Use `.focus-visible` to style elements when focused via keyboard.', 'Ensure styles are not applied on mouse click.']
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTML',
      language: 'html',
      code: `
        <button tabindex="0">Focusable Button</button>
        <div tabindex="-1">Non-focusable Div</div>
      `
    },
    {
      label: 'CSS',
      language: 'css',
      code: `
        .focus-visible:focus {
          outline: 2px solid blue;
        }
      `
    },
    {
      label: 'JavaScript',
      language: 'typescript',
      code: `
        document.querySelector('button').addEventListener('click', () => {
          document.querySelector('div').focus();
        });
      `
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Incorrect Tab Index Usage',
      wrong: '<input tabindex="100">',
      right: '<input tabindex="2">',
      explanation: 'Avoid using high tab indexes. Use sequential and logical values.'
    },
    {
      title: 'Missing ARIA Modal Attribute',
      wrong: '<dialog>...</dialog>',
      right: '<dialog aria-modal="true">...</dialog>',
      explanation: 'Ensure modal dialogs are accessible to screen readers.'
    },
    {
      title: 'Focus Not Set Programmatically',
      wrong: `<button onclick="alert('Clicked')">Click Me</button>`,
      right: `<button onclick="this.focus()">Click Me</button>`,
      explanation: 'Use `focus()` method for programmatic focus control.'
    },
    {
      title: 'Skip Link Without Description',
      wrong: '<a href="#main-content">Skip to Content</a>',
      right: '<a href="#main-content">Skip directly to the main content</a>',
      explanation: 'Ensure skip links are descriptive for accessibility.'
    }
  ];

  challenge: Challenge = {
    title: 'Focus Management in a Modal',
    language: 'html',
    description: 'Create a modal dialog with focus trapping and skip navigation link.',
    hints: ['Use `aria-modal="true"`.', 'Trap focus within the modal using JavaScript.', 'Provide a skip link at the beginning of the page.'],
    starterCode: `
      <div>
        <button id="skip-link" tabindex="0">Skip to main content</button>
        <dialog aria-modal="true">
          <h2>Modal Title</h2>
          This is a modal dialog.
        </dialog>
      </div>
    `,
    solution: `
      <div>
        <button id="skip-link" tabindex="0">Skip to main content</button>
        <dialog aria-modal="true">
          <h2>Modal Title</h2>
          This is a modal dialog.
        </dialog>
        <script>
          document.getElementById('skip-link').addEventListener('click', () => {
            document.querySelector('dialog').showModal();
          });
          document.querySelector('dialog').addEventListener('close', () => {
            document.getElementById('skip-link').focus();
          });
        </script>
      </div>
    `
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `tabindex="0"` do?',
      options: ['Makes an element focusable.', 'Hides an element from tab navigation.', 'Disables an element completely.'],
      answer: 0,
      explanation: 'Elements with `tabindex="0"` are included in the tab order, making them focusable.'
    },
    {
      q: 'Which ARIA attribute should be used on modal dialogs?',
      options: ['aria-modal', 'aria-hidden', 'aria-expanded'],
      answer: 0,
      explanation: 'Using `aria-modal="true"` ensures that screen readers treat the dialog as a modal.'
    },
    {
      q: 'What is the purpose of `.focus-visible` CSS class?',
      options: ['Stylizes elements when focused.', 'Applies focus styles on mouse click.', 'Adds focus outline.'],
      answer: 0,
      explanation: '.focus-visible is used to apply focus styles only when an element is focused via keyboard navigation.'
    },
    {
      q: 'How do you programmatically set focus to an element?',
      options: ['Use `element.focus()`.', 'Set `tabindex="1"`.', 'Add a class with `.focus()`.'],
      answer: 0,
      explanation: 'Calling `element.focus()` method sets focus on the specified element.'
    },
    {
      q: 'What should be included in a skip navigation link?',
      options: ['A descriptive link text.', 'An icon.', 'The URL of the destination.'],
      answer: 0,
      explanation: 'Skip links should include a descriptive link text for better accessibility.'
    }
  ];

  qna: QnaItem[] = [
    {
      q: 'How can I ensure that an element remains focusable after being clicked?',
      a: 'Use `event.preventDefault()` to prevent the default action and then call `.focus()` on the target element.'
    },
    {
      q: 'What is the difference between `tabindex="-1"` and `tabindex="0"`?',
      a: '`tabindex="-1"` makes an element focusable but not navigable via tab key, while `tabindex="0"` makes it part of the natural tab sequence.'
    },
    {
      q: 'How can I trap focus within a modal dialog?',
      a: 'Set `aria-modal="true"` on the dialog and use JavaScript to manage focus within the modal and return it to the trigger element when closed.'
    },
    {
      q: 'What is the purpose of the `.focus-visible` class?',
      a: '.focus-visible applies styles when an element is focused using keyboard navigation, ensuring that visual cues are available for keyboard users.'
    }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Master focus management techniques to enhance accessibility in your web applications.',
    mustKnow: ['tabindex', ':focus-visible', 'focus()', 'aria-modal', 'skip links'],
    interviewFocus: ['Keyboard navigation best practices', 'Accessibility enhancements', 'JavaScript for DOM manipulation']
  };
}

