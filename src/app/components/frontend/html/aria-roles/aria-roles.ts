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
    },
    {
      heading: 'When ARIA Is Necessary vs When Native HTML Is Better',
      points: [
        'The first rule of ARIA: do not use ARIA if a native HTML element or attribute already provides the semantics you need. A native <code>&lt;button&gt;</code> gets keyboard focus, Enter/Space activation, and the "button" role automatically — a <code>&lt;div role="button"&gt;</code> requires you to manually implement all of that yourself with JavaScript.',
        'ARIA only changes what assistive technology announces — it does not add any behavior. Setting <code>role="button"</code> on a div does not make it focusable or clickable via keyboard; you must also add <code>tabindex="0"</code> and manually handle Enter/Space key events.',
        'Overusing ARIA is a real accessibility anti-pattern: incorrect or redundant roles (like <code>role="button"</code> on an actual <code>&lt;button&gt;</code> element) can confuse screen readers rather than help them, since the implicit native role is overridden by the explicit one.',
        'ARIA is appropriate for genuinely custom widgets with no native HTML equivalent — a tab panel, a combobox with custom filtering, a tree view — where you must manually construct the accessibility tree that native elements would otherwise provide for free.',
      ]
    },
    {
      heading: 'Testing ARIA Implementation',
      points: [
        'Automated tools (axe DevTools, Lighthouse accessibility audit) catch a meaningful subset of ARIA misuse — missing labels, invalid role/attribute combinations, contrast failures — but cannot verify that the actual user EXPERIENCE with a screen reader makes sense.',
        'Manual screen reader testing (VoiceOver on macOS/iOS, NVDA or JAWS on Windows, TalkBack on Android) is essential for genuinely verifying ARIA correctness — automated tools check the accessibility tree\'s structure, not whether navigating it actually communicates the right information in the right order.',
        'Keyboard-only navigation testing (unplug the mouse, navigate with Tab/Shift+Tab/Enter/Arrow keys alone) reveals whether custom ARIA widgets actually implement the expected keyboard interaction patterns — a combobox with correct ARIA roles but no arrow-key navigation is still broken for keyboard users.',
        'The browser\'s built-in Accessibility Tree inspector (Chrome DevTools Elements panel, "Accessibility" tab) shows exactly how each element is exposed to assistive technology — invaluable for debugging why a screen reader announces something unexpected.',
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
    },
    {
      q: 'What does role="presentation" do to an element?',
      options: ['Makes it visible only in presentations', 'Removes the element\'s semantic role from the accessibility tree while keeping it visually', 'Adds a slideshow role', 'Prevents the element from being focusable'],
      answer: 1,
      explanation: 'role="presentation" (or role="none") strips an element\'s implicit ARIA semantics. Commonly used on layout tables (<table role="presentation">) to prevent screen readers from announcing it as a "table with X rows".',
    },
    {
      q: 'What is the difference between aria-disabled and the HTML disabled attribute?',
      options: ['They are identical', 'disabled removes the element from the tab order and prevents events; aria-disabled only announces it as disabled but keeps it focusable', 'aria-disabled is only for ARIA widgets', 'disabled is deprecated'],
      answer: 1,
      explanation: 'The native disabled attribute removes the element from the tab order, prevents events, and tells AT it is disabled. aria-disabled="true" keeps the element in the tab order and receives events — useful when you want keyboard users to still discover the element and be told why it is unavailable.',
    },
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
    },
    {
      q: 'What is the first rule of ARIA?',
      a: 'The first rule of ARIA use is: "Do not use ARIA if you can use a native HTML element or attribute with the semantics and behaviour you need." Native elements are more reliable, require no JavaScript to maintain state, and are already well-tested across browsers and assistive technologies. ARIA supplements HTML when custom widgets are unavoidable — it does not replace semantic HTML.',
    },
    {
      q: 'What does role="alert" do and how does it differ from role="status"?',
      a: 'role="alert" creates an implicit ARIA live region with aria-live="assertive" — the screen reader interrupts what it is currently saying to announce the new content immediately. Use it for time-sensitive errors (form submission failure, payment error). role="status" is polite — it waits until the current utterance finishes. Use status for success messages and informational updates that do not require immediate attention.',
    },
    {
      q: 'When should you add a role to a <div> vs using a semantic element?',
      a: 'Use a semantic element first: <code>&lt;button&gt;</code>, <code>&lt;input&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;article&gt;</code>. Add role to a div only when no HTML element matches the widget pattern — interactive roles like role="tab", role="treeitem", role="combobox" have no native HTML equivalent. When you add a role, you take on full responsibility for keyboard behaviour (arrow key navigation, state management), focus management, and maintaining all required ARIA states and properties.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ARIA roles and attributes enhance accessibility by providing semantic information and interaction states.',
    mustKnow: ['Role categories', 'aria-label/labelledby/describedby', 'aria-expanded/hidden/required/live/atomic'],
    interviewFocus: ['Common ARIA mistakes', 'Implementing interactive elements', 'Handling live regions']
  };

}
