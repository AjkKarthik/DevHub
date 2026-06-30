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
  templateUrl: './input-types.html',
  styleUrl: './input-types.scss'
})
export class HtmlInputTypes {

  quickRef: QuickRefItem[] = [
    { name: 'email', type: 'keyword', desc: 'Specifies that the input should be an email address.' },
    { name: 'tel', type: 'keyword', desc: 'Indicates that the input is a telephone number.' },
    { name: 'url', type: 'keyword', desc: 'Specifies that the input should be a URL.' },
    { name: 'number', type: 'keyword', desc: 'Limits the input to numeric values.' },
    { name: 'date', type: 'keyword', desc: 'Creates an input field for entering a date.' },
    { name: 'range', type: 'keyword', desc: 'Allows users to enter a number between min and max.' },
    { name: 'color', type: 'keyword', desc: 'Lets the user select a color from a palette.' },
    { name: 'search', type: 'keyword', desc: 'Indicates that the input should be used for search.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Autocomplete',
      points: ['autocomplete="on"', 'autocomplete="off"', 'Affects browser autofill suggestions.']
    },
    {
      heading: 'Placeholder',
      points: ['placeholder="Your text here"', 'Displays a hint in the input field.', 'Clears when user starts typing.']
    },
    {
      heading: 'Pattern',
      points: ['pattern="[a-z]{3,}"', 'Defines a regular expression for pattern validation.', 'Shows message if invalid.']
    },
    {
      heading: 'Min/Max',
      points: ['min="1"', 'max="10"', 'Limits the value to a range for numeric and date inputs.']
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTML',
      language: 'html',
      code: `
        <input type="email" placeholder="Enter email">
        <input type="tel" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
        <input type="number" min="1" max="10">
        <input type="date">
        <input type="range" min="0" max="100">
        <input type="color">
        <input type="search" autocomplete="off">
      `
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Incorrect pattern syntax',
      wrong: 'pattern="[a-z]"',
      right: 'pattern="[a-z]{3,}"',
      explanation: 'The pattern should specify a valid regular expression.'
    },
    {
      title: 'Autocomplete not working',
      wrong: 'autocomplete="true"',
      right: 'autocomplete="on"',
      explanation: 'Use "on" or "off" instead of true/false.'
    },
    {
      title: 'Number input without range',
      wrong: '<input type="number">',
      right: '<input type="number" min="1" max="100">',
      explanation: 'Specify a min and max for better user experience.'
    }
  ];

  challenge: Challenge = {
    title: 'Create an Email Form',
    language: 'html',
    description: 'Create an HTML form with fields for email, phone number, age range, and preferred color.',
    hints: ['Use <input type="email">', '<input type="tel">', '<input type="range" min="18" max="65">', '<input type="color">'],
    starterCode: `
      <form>
        <!-- Add your fields here -->
      </form>
    `,
    solution: `
      <form>
        <label for="email">Email:</label>
        <input id="email" type="email" placeholder="Enter email">
        <br><br>
        <label for="phone">Phone Number:</label>
        <input id="phone" type="tel" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
        <br><br>
        <label for="age">Age Range (18-65):</label>
        <input id="age" type="range" min="18" max="65">
        <br><br>
        <label for="color">Preferred Color:</label>
        <input id="color" type="color">
      </form>
    `
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which input type is used for entering a date?',
      options: ['text', 'date', 'email'],
      answer: 1,
      explanation: 'The correct answer is "date".'
    },
    {
      q: 'What attribute is used to display a hint in an input field?',
      options: ['placeholder', 'title', 'label'],
      answer: 0,
      explanation: 'The correct answer is "placeholder".'
    },
    {
      q: 'Which input type allows users to select a color from a palette?',
      options: ['text', 'color', 'number'],
      answer: 1,
      explanation: 'The correct answer is "color".'
    },
    {
      q: 'Which input type provides a date picker UI in supported browsers?',
      options: ['text', 'datetime', 'date', 'calendar'],
      answer: 2,
      explanation: '<input type="date"> renders a native date picker widget in supported browsers (Chrome, Firefox, Safari). The value is always returned in YYYY-MM-DD format regardless of the displayed locale. Feature-detect and fallback gracefully — some browsers render it as a text input.',
    },
    {
      q: 'What does the step attribute control on a number or range input?',
      options: ['The minimum value', 'The increment between valid values', 'The number of decimal places', 'The animation speed of the slider'],
      answer: 1,
      explanation: 'step="0.5" on a number input means valid values are multiples of 0.5 from the min. step="any" removes the constraint. On range inputs, step controls slider snap points. Browsers show a validation error if the value is not a multiple of step.',
    },
    {
      q: 'What is the difference between type="submit" and type="button"?',
      options: ['They are identical', 'submit triggers native form submission; button has no default behavior and needs a JS handler', 'button can be styled differently', 'submit only works inside <form>; button works anywhere'],
      answer: 1,
      explanation: 'type="submit" submits the enclosing form — including running HTML5 constraint validation. type="button" has no default action; it is purely a trigger for JavaScript. type="reset" clears all form fields to their default values. Always specify the type — the default is "submit", which can accidentally submit forms.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What does the autocomplete attribute do?', a: 'It controls whether or not the browser should autofill form fields.' },
    { q: 'How can you ensure that a user enters only numbers in an input field?', a: 'Use the type="number" attribute and optionally set min and max values.' },
    { q: 'What is the difference between type="tel" and type="number" for phone numbers?', a: 'type="tel" is specifically for phone numbers — it triggers a numeric/phone keypad on mobile and accepts any string (including +, -, spaces, parentheses). It does NOT validate format. type="number" triggers a numeric keypad but rejects non-numeric characters and adds spinner buttons — wrong for phone numbers. Use type="tel" with a pattern attribute for phone validation.' },
    { q: 'What does the autocomplete attribute do on form inputs?', a: 'The autocomplete attribute hints to the browser what type of data this field holds so it can offer autofill: autocomplete="email" for email, autocomplete="new-password" to prevent password autofill (for change-password forms), autocomplete="cc-number" for credit card. Use autocomplete="off" sparingly — browsers often ignore it for password fields. Proper autocomplete attributes significantly improve form completion rates on mobile.' },
    { q: 'How do you accept only specific file types in a file upload input?', a: 'Use the accept attribute: <code>&lt;input type="file" accept=".pdf,.docx,image/*"&gt;</code>. Values can be MIME types (image/png), wildcards (image/*), or file extensions (.pdf). The browser filters the file picker, but THIS IS NOT SECURITY — users can still bypass it. Always validate file types server-side and use Content-Type checking, magic bytes verification, or file scanning.' },
    { q: 'What is the inputmode attribute and how does it differ from type?', a: 'inputmode controls which virtual keyboard appears on mobile without changing validation behaviour. Example: <code>&lt;input type="text" inputmode="numeric"&gt;</code> shows a numeric keyboard for a text field that accepts things like formatted numbers ("+1 (555) 000-0000"). type determines validation and browser behaviour; inputmode only affects the on-screen keyboard. Common values: numeric, decimal, tel, email, url, search.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Learned about various HTML5 input types and their attributes.',
    mustKnow: ['email', 'tel', 'url', 'number', 'date', 'range', 'color', 'search', 'autocomplete', 'placeholder', 'pattern', 'min/max'],
    interviewFocus: ['Understanding of different input types', 'Usage of attributes like autocomplete and pattern']
  };
}
