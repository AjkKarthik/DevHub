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
  templateUrl: './landmark-elements.html',
  styleUrl: './landmark-elements.scss'
})
export class HtmlLandmarkElements {

  quickRef: QuickRefItem[] = [
    { name: 'header', type: 'keyword', desc: 'The header section of a page' },
    { name: 'nav', type: 'keyword', desc: 'Navigation links' },
    { name: 'main', type: 'keyword', desc: 'Main content of the page' },
    { name: 'aside', type: 'keyword', desc: 'Complementary content' },
    { name: 'footer', type: 'keyword', desc: 'Footer section of a page' },
    { name: 'form', type: 'keyword', desc: 'Form element' },
    { name: 'search', type: 'keyword', desc: 'Search functionality' },
    { name: 'region', type: 'keyword', desc: 'Section with a unique heading' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Header',
      points: ['Use <header> for the header section of a page.', 'It contains brand, navigation, and site title.']
    },
    {
      heading: 'Navigation',
      points: ['Use <nav> for navigation links.', 'It helps users find different sections of the website quickly.']
    },
    {
      heading: 'Main Content',
      points: ['Use <main> for the main content of a page.', 'There should be only one <main> per document.']
    },
    {
      heading: 'Complementary Content',
      points: ['Use <aside> for complementary content.', 'It can include sidebars, widgets, or additional info related to the main content.']
    },
    {
      heading: 'Footer',
      points: ['Use <footer> for the footer section of a page.', 'It contains copyright info, links to other pages, and contact info.']
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTML Header',
      language: 'html',
      code: `
<header>
  <h1>My Website</h1>
  <nav>
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </nav>
</header>
`
    },
    {
      label: 'HTML Main',
      language: 'html',
      code: `
<main>
  <h1>Welcome to My Website</h1>
  This is the main content of the page.
</main>
`
    },
    {
      label: 'HTML Aside',
      language: 'html',
      code: `
<aside>
  <h2>Related Links</h2>
  <ul>
    <li><a href="#">Link 1</a></li>
    <li><a href="#">Link 2</a></li>
  </ul>
</aside>
`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Incorrect Use of <header>',
      wrong: '<div class="header">...</div>',
      right: '<header>...</header>',
      explanation: '<header> is a semantic tag and should be used for the header section of a page.'
    },
    {
      title: 'Multiple <main> Elements',
      wrong: `<main>...</main><main>...</main>`,
      right: `<main>...</main>`,
      explanation: 'There should only be one <main> element per document.'
    },
    {
      title: 'Incorrect Use of <aside>',
      wrong: '<div class="sidebar">...</div>',
      right: '<aside>...</aside>',
      explanation: '<aside> is a semantic tag and should be used for complementary content.'
    },
    {
      title: 'Missing <footer> Section',
      wrong: `<main>...</main><aside>...</aside>`,
      right: `<main>...</main><aside>...</aside><footer>...</footer>`,
      explanation: '<footer> is an important section and should be included in every page.'
    }
  ];

  challenge: Challenge = {
    title: 'Create a Simple Layout with ARIA Landmarks',
    language: 'html',
    description: 'Create a simple website layout using the eight ARIA landmark roles.',
    hints: [
      'Use <header> for the header section.',
      'Use <nav> for navigation links.',
      'Use <main> for the main content.',
      'Use <aside> for complementary content.',
      'Use <footer> for the footer.'
    ],
    starterCode: `
<!-- Starter code -->
<header></header>
<nav></nav>
<main></main>
<aside></aside>
<footer></footer>
`,
    solution: `
<!-- Solution code -->
<header>
  <h1>My Website</h1>
  <nav>
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </nav>
</header>

<main>
  <h1>Welcome to My Website</h1>
  This is the main content of the page.
</main>

<aside>
  <h2>Related Links</h2>
  <ul>
    <li><a href="#">Link 1</a></li>
    <li><a href="#">Link 2</a></li>
  </ul>
</aside>

<footer>
  Copyright © 2023 My Website
</footer>
`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which ARIA landmark role is used for the header section of a page?',
      options: ['header', 'nav', 'main', 'aside'],
      answer: 0,
      explanation: '<header> is used for the header section.'
    },
    {
      q: 'How many <main> elements should be in a document?',
      options: ['1', '2', '3', '4'],
      answer: 0,
      explanation: 'There should only be one <main> element per document.'
    },
    {
      q: 'Which ARIA landmark role is used for complementary content?',
      options: ['header', 'nav', 'main', 'aside'],
      answer: 3,
      explanation: '<aside> is used for complementary content.'
    },
    {
      q: 'What does <footer> represent?',
      options: ['Main content', 'Header section', 'Complementary content', 'Footer section'],
      answer: 3,
      explanation: '<footer> represents the footer section of a page.'
    },
    {
      q: 'Which ARIA landmark role is used for search functionality?',
      options: ['header', 'nav', 'main', 'search'],
      answer: 3,
      explanation: '<search> is used for search functionality.'
    }
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the purpose of using ARIA landmark roles in HTML?',
      a: 'ARIA landmark roles help assistive technologies to understand the structure and content of a webpage, making it easier for users with disabilities to navigate and use the website.'
    },
    {
      q: 'How can I label an element with multiple landmarks?',
      a: 'You can label an element with multiple landmarks by using different ARIA landmark roles within the same parent element. However, remember that each element should only have one primary role.'
    },
    {
      q: 'What is the difference between <header> and <nav>?',
      a: '<header> represents the header section of a page, while <nav> represents a section with navigation links. <nav> can appear multiple times within a document, but <header> should typically only appear once.'
    },
    {
      q: 'What is the <region> landmark role used for?',
      a: '<region> is used for any section of a page that has a unique heading or label, such as a sidebar or a main content area with a specific topic.'
    }
  ];

  revision: RevisionSummary = {
    oneLiner: 'ARIA landmark roles help improve accessibility by providing semantic structure to web pages.',
    mustKnow: ['header', 'nav', 'main', 'aside', 'footer', 'form', 'search', 'region'],
    interviewFocus: ['Understanding ARIA landmarks', 'Using multiple landmarks in a single element', 'Best practices for using ARIA landmarks']
  };

}

