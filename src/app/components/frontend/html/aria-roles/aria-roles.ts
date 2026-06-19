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
  templateUrl: './aria-roles.html',
  styleUrl: './aria-roles.scss'
})
export class HtmlAriaRoles {

  quickRef: QuickRefItem[] = [
    { name: 'role', type: 'keyword', desc: 'Specifies the role of an element.' },
    { name: 'aria-label', type: 'keyword', desc: 'Provides a text label for an element.' },
    { name: 'aria-labelledby', type: 'keyword', desc: 'Refers to the element that labels the current element.' },
    { name: 'aria-describedby', type: 'keyword', desc: 'Refers to elements that describe the current element.' },
    { name: 'aria-expanded', type: 'keyword', desc: 'Indicates whether a collapsible element is currently expanded or collapsed.' },
    { name: 'aria-hidden', type: 'keyword', desc: 'Hides an element from assistive technologies.' },
    { name: 'aria-required', type: 'keyword', desc: 'Indicates that the current element must be filled out before the form can be submitted.' },
    { name: 'aria-live', type: 'keyword', desc: 'Announces changes to the user immediately, often used for live regions like notifications or updates.' },
    { name: 'aria-atomic', type: 'keyword', desc: 'Indicates whether assistive technologies should present all, or only parts of, the changed region when a change occurs.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ARIA Role Categories',
      points: ['Landmark', 'Widget', 'Document', 'Live Region']
    },
    {
      heading: 'aria-label/labelledby/describedby',
      points: [
        '<code>aria-label</code>: Provides a text label for an element.',
        '<code>aria-labelledby</code>: Refers to the element that labels the current element.',
        '<code>aria-describedby</code>: Refers to elements that describe the current element.'
      ]
    },
    {
      heading: 'aria-expanded/hidden/required/live/atomic',
      points: [
        '<code>aria-expanded</code>: Indicates whether a collapsible element is currently expanded or collapsed.',
        '<code>aria-hidden</code>: Hides an element from assistive technologies.',
        '<code>aria-required</code>: Indicates that the current element must be filled out before the form can be submitted.',
        '<code>aria-live</code>: Announces changes to the user immediately.',
        '<code>aria-atomic</code>: Indicates whether assistive technologies should present all, or only parts of, the changed region when a change occurs.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Example',
      language: 'html',
      code: `
        <button role="button" aria-label="Toggle Sidebar">Toggle Sidebar</button>
        <div id="sidebar" role="complementary" aria-labelledby="sidebar-title">
          <h2 id="sidebar-title">Sidebar Content</h2>
          <!-- Sidebar content -->
        </div>
        <input type="text" role="textbox" aria-label="Search Input" aria-required="true">
      `
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Incorrect Role Usage',
      wrong: '<button role="link">Click me</button>',
      right: '<a href="#" role="button">Click me</a>',
      explanation: 'Roles should be used for elements that are not natively supported by HTML.'
    },
    {
      title: 'Missing aria-label',
      wrong: '<button>Submit</button>',
      right: '<button aria-label="Submit">Submit</button>',
      explanation: 'All interactive elements should have a clear label.'
    },
    {
      title: 'Overuse of aria-hidden',
      wrong: '<div role="banner" aria-hidden="true">Important Notice</div>',
      right: '<div role="banner">Important Notice</div>',
      explanation: 'Use <code>aria-hidden</code> sparingly and only when necessary.'
    },
    {
      title: 'Incorrect use of aria-live',
      wrong: '<span role="alert" aria-live="off">New Notification</span>',
      right: '<span role="alert" aria-live="polite">New Notification</span>',
      explanation: 'Use <code>aria-live</code> appropriately to avoid overwhelming the user.'
    }
  ];

  challenge: Challenge = {
    title: 'Create a Toggle Button',
    language: 'html',
    description: 'Create an interactive toggle button that uses ARIA roles and attributes correctly.',
    hints: [
      'Use <code>aria-expanded</code> to indicate the state of the button.',
      'Use <code>aria-label</code> or <code>aria-labelledby</code> for a clear label.'
    ],
    starterCode: `
      <button role="button" aria-label="Toggle" aria-expanded="false">Toggle</button>
      <div id="toggle-content" role="region" aria-labelledby="toggle-title" hidden>
        <h2 id="toggle-title">Toggle Content</h2>
        <!-- Toggle content -->
      </div>
    `,
    solution: `
      <button role="button" aria-label="Toggle" (click)="toggle()" [attr.aria-expanded]="isExpanded.toString()">Toggle</button>
      <div id="toggle-content" role="region" aria-labelledby="toggle-title" hidden [hidden]="!isExpanded">
        <h2 id="toggle-title">Toggle Content</h2>
        <!-- Toggle content -->
      </div>
    `
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ARIA role category includes elements that represent logical sections within a document?',
      options: ['Landmark', 'Widget', 'Document', 'Live Region'],
      answer: 2,
      explanation: 'The "Document" role category includes elements like headings, paragraphs, and sections that represent logical document structure.'
    },
    {
      q: 'What is the purpose of <code>aria-describedby</code>?',
      options: [
        'Provides a text label for an element.',
        'Refers to elements that describe the current element.',
        'Indicates whether a collapsible element is currently expanded or collapsed.',
        'Hides an element from assistive technologies.'
      ],
      answer: 1,
      explanation: '<code>aria-describedby</code> references one or more elements whose content acts as a description for the current element — used for supplementary information beyond the label.'
    },
    {
      q: 'How should you handle changes in a live region?',
      options: [
        'Use <code>aria-live="off"</code> to hide the changes.',
        'Use <code>aria-live="polite"</code> to announce the changes at the end of other speech.',
        'Use <code>aria-atomic="true"</code> to announce only the changed region.'
      ],
      answer: 1,
      explanation: '<code>aria-live="polite"</code> waits until the screen reader finishes its current speech before announcing the update — the correct default for non-urgent live regions.'
    },
    {
      q: 'Which ARIA attribute should you use to indicate that a form field is required?',
      options: ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required'],
      answer: 3,
      explanation: '<code>aria-required="true"</code> tells assistive technologies that the field must be filled before submitting. Prefer the native <code>required</code> attribute when possible.'
    }
  ];

  qna: QnaItem[] = [
    {
      q: 'What happens if an element has both <code>aria-label</code> and <code>aria-labelledby</code>?',
      a: 'Both attributes are processed, with the value of <code>aria-labelledby</code> taking precedence.'
    },
    {
      q: 'When should you use <code>aria-hidden="true"</code>?',
      a: 'Use it when an element is not needed for accessibility and should be excluded from the document flow.'
    },
    {
      q: 'How does <code>aria-expanded</code> help with interactive elements?',
      a: 'It indicates whether an element, such as a dropdown menu, is currently expanded or collapsed, allowing assistive technologies to provide context to the user.'
    }
  ];

  revision: RevisionSummary = {
    oneLiner: 'ARIA roles and attributes enhance accessibility by providing semantic information and interaction states.',
    mustKnow: ['Role categories', 'aria-label/labelledby/describedby', 'aria-expanded/hidden/required/live/atomic'],
    interviewFocus: ['Common ARIA mistakes', 'Implementing interactive elements', 'Handling live regions']
  };

}
