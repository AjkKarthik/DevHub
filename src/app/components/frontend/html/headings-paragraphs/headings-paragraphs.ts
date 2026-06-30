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
  templateUrl: './headings-paragraphs.html',
  styleUrl: './headings-paragraphs.scss'
})
export class HtmlHeadingsParagraphs {
  quickRef: QuickRefItem[] = [
    { name: 'h1', type: 'keyword', desc: 'The highest heading level.' },
    { name: 'h2', type: 'keyword', desc: 'The second highest heading level.' },
    { name: 'p', type: 'keyword', desc: 'A paragraph of text.' },
    { name: 'br', type: 'keyword', desc: 'A line break.' },
    { name: 'strong', type: 'keyword', desc: 'Emphasized text.' },
    { name: 'b', type: 'keyword', desc: 'Bold text.' },
    { name: 'em', type: 'keyword', desc: 'Italic text.' },
    { name: 'i', type: 'keyword', desc: 'Italic text.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Heading Hierarchy',
      points: ['h1 is the highest level of heading.', 'h6 is the lowest level of heading.']
    },
    {
      heading: 'Paragraphs',
      points: ['p tags are used to define a paragraph.', 'A paragraph starts with a new line.']
    },
    {
      heading: 'Line Breaks',
      points: ['br tag inserts a single line break.', 'It does not require closing tag.']
    },
    {
      heading: 'Strong vs B',
      points: ['strong emphasizes text semantically.', 'b is used for styling purposes only.']
    },
    {
      heading: 'Em vs I',
      points: ['em emphasizes text semantically.', 'i is used for styling purposes only.']
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTML Headings & Paragraphs',
      language: 'html',
      code: `
<h1>This is an h1 heading</h1>
<h2>This is an h2 heading</h2>
This is a paragraph.
<br>
<strong>Strong text</strong>
<b>Bold text</b>
<em>Emphasized text</em>
<i>Italic text</i>
`
    },
    {
      label: 'Heading Hierarchy',
      language: 'html',
      code: `
<h1>The highest heading level</h1>
<h2>The second highest heading level</h2>
<h3>The third highest heading level</h3>
<h4>The fourth highest heading level</h4>
<h5>The fifth highest heading level</h5>
<h6>The lowest heading level</h6>
`
    },
    {
      label: 'Paragraphs & Line Breaks',
      language: 'html',
      code: `
This is a paragraph.<br>This text is on a new line.
Another paragraph.
`
    }
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using <strong> instead of <b>', wrong: '<strong>This is bold</strong>', right: '<b>This is bold</b>', explanation: 'Use <strong> for semantic emphasis, <b> for styling.' },
    { title: 'Using <em> instead of <i>', wrong: '<em>This is italic</em>', right: '<i>This is italic</i>', explanation: 'Use <em> for semantic emphasis, <i> for styling.' },
    { title: 'Forcing line breaks with <br>', wrong: 'This is a long text<br>that should be on new lines.', right: 'This is a long text that should be on new lines.', explanation: 'Use CSS for line breaks, not <br>' },
    { title: 'Incorrect heading levels', wrong: '<h4>This should be an h2</h4>', right: '<h2>This should be an h2</h2>', explanation: 'Choose heading levels that reflect the content hierarchy.' }
  ];

  challenge: Challenge = {
    title: 'Create a Simple Paragraph',
    language: 'html',
    description: 'Create a paragraph with bold and italic text using the appropriate HTML tags.',
    hints: ['Use  for the paragraph.', '<strong> for bold text.', '<em> or <i> for italic text.'],
    starterCode: `
<p>This is a paragraph.
This is some <strong>bold</strong> text.
This is some <em>italic</em> text.
`,
    solution: `
This is a paragraph.<br>This is some <strong>bold</strong> text.<br>This is some <em>italic</em> text.
`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which HTML tag is used to define a heading?',
      options: ['<header>', '<section>', '<h1>', '<div>'],
      answer: 2,
      explanation: '<h1> is the correct tag for defining a heading.'
    },
    {
      q: 'What does <strong> do?',
      options: ['Emphasizes text semantically', 'Bold text', 'Italic text', 'Line break'],
      answer: 0,
      explanation: '<strong> emphasizes text semantically, not just makes it bold.'
    },
    {
      q: 'Which tag is used to insert a line break?',
      options: ['<br>', '<p>', '<h1>', '<div>'],
      answer: 0,
      explanation: '<br> is the correct tag for inserting a line break.'
    },
    {
      q: 'What is the difference between <strong> and <b>?',
      options: ['<strong> is styled, <b> is semantic', '<b> is styled, <strong> is semantic', '<strong> and <b> are the same', '<i> and <em> are the same'],
      answer: 1,
      explanation: '<b> is used for styling purposes only, while <strong> emphasizes text semantically.'
    },
    {
      q: 'What does <em> do?',
      options: ['Emphasizes text semantically', 'Bold text', 'Italic text', 'Line break'],
      answer: 0,
      explanation: '<em> emphasizes text semantically, not just makes it italic.'
    },
    {
      q: 'Can there be more than one <h1> on a page?',
      options: ['No — only one h1 is allowed per page', 'Yes — one per sectioning element is valid, but one per page is still the SEO best practice', 'Yes — unlimited h1 elements are required', 'Only if nested inside article elements'],
      answer: 1,
      explanation: 'The HTML5 document outline algorithm allowed multiple h1s (one per section). However, browsers never implemented the outline algorithm, and multiple h1s confused screen readers. Best practice today: one h1 per page (the main topic), use h2–h6 for subsections.',
    }
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between <strong> and <i>?', a: '<strong> emphasizes text semantically, while <i> is used for styling purposes only.' },
    { q: 'How do you create a line break without using <br> tag?', a: 'Use CSS to control line breaks.' },
    { q: 'What are the heading levels in HTML?', a: '<h1> to <h6>' },
    { q: 'How can you add emphasis to text in HTML?', a: 'Use <strong> or <em> tags.' },
    { q: 'What is the difference between <b> and <strong>, and <i> and <em>?', a: '<strong> conveys strong importance (semantic); <b> is just bold with no semantic meaning. Similarly, <em> conveys emphasis (semantic — changes meaning); <i> is just italic (used for technical terms, foreign words, titles in running text). Assistive technologies may treat <strong> and <em> differently from <b> and <i>. Prefer the semantic versions for content; use <b> and <i> only for typographic convention.' },
    { q: 'When should you use <blockquote> vs <q>?', a: '<blockquote> is for extended block-level quotations — paragraphs of quoted text with a cite attribute pointing to the source URL. <q> is for short inline quotations — browsers add quotation marks automatically based on locale. Use <cite> (inline) for referencing the title of a work (book, film). Do NOT use <blockquote> just for visual indentation — use CSS margin/padding for that.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Understand and use HTML headings, paragraphs, and text styling elements correctly.',
    mustKnow: ['<h1> - <h6>', '<p>', '<br>', '<strong>', '<b>', '<em>', '<i>'],
    interviewFocus: ['HTML semantic elements', 'CSS vs HTML for styling', 'Best practices for heading hierarchy']
  };
}

