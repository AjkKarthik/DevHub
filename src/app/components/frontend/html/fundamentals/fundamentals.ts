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
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class HtmlFundamentals {

  quickRef: QuickRefItem[] = [
    { name: 'doctype', type: 'keyword', desc: 'The document type declaration defines the HTML version.' },
    { name: 'character encoding', type: 'keyword', desc: 'The charset attribute in the meta tag specifies the character set of an HTML document.' },
    { name: 'void elements', type: 'syntax', desc: 'Void elements are self-closing and do not have a closing tag, such as &lt;br&gt; or &lt;img&gt;.' },
    { name: 'block elements', type: 'keyword', desc: 'Block elements define large sections of a web page, like &lt;div&gt;, &lt;p&gt;, and &lt;header&gt;.' },
    { name: 'inline elements', type: 'keyword', desc: 'Inline elements do not start on a new line and are typically used within block elements, such as &lt;a&gt;, &lt;span&gt;, and &lt;img&gt;.' },
    { name: 'HTML tree', type: 'syntax', desc: 'The HTML tree is the hierarchical structure of an HTML document represented in memory.' },
    { name: 'DOM tree', type: 'keyword', desc: 'The Document Object Model (DOM) represents the page so it can be manipulated by JavaScript.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'HTML Elements',
      points: [
        'Elements are defined with a start tag and an end tag, like &lt;div&gt;&lt;/div&gt;',
        'Self-closing tags do not need a closing tag, like &lt;br&gt;'
      ]
    },
    {
      heading: 'HTML Attributes',
      points: [
        'Attributes provide additional information about an element, such as &lt;a href="https://example.com"&gt;Link&lt;/a&gt;',
        'Boolean attributes can have no value, just the name, like &lt;input type="checkbox" checked&gt;'
      ]
    },
    {
      heading: 'HTML Parsing Process',
      points: [
        'The browser reads and parses the HTML from top to bottom.',
        'It constructs the DOM tree based on the parsed HTML.'
      ]
    },
    {
      heading: 'Block vs Inline Elements',
      points: [
        'Block elements create a new block in the layout, like &lt;div&gt;',
        'Inline elements do not start a new line and flow within existing blocks, like &lt;a&gt;'
      ]
    },
    {
      heading: 'DOCTYPE',
      points: [
        'The DOCTYPE declaration is crucial for HTML5 and specifies the document type.',
        'It helps browsers render pages correctly.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTML Structure',
      language: 'html',
      code: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page Title</title>
</head>
<body>
  <div class="container">
    <h1>Welcome to HTML</h1>
    This is a paragraph.
    <img src="image.jpg" alt="Description of the image">
  </div>
</body>
</html>`
    },
    {
      label: 'Void Element Example',
      language: 'html',
      code: `
This is a line of text.<br> This is another line of text.`
    },
    {
      label: 'Inline vs Block Elements',
      language: 'html',
      code: `
<div>
  <span>This is an inline element</span>
  This is a block element
</div>`
    }
  ];

  mistakes: CommonMistake[] = [
    { title: 'Incorrect DOCTYPE', wrong: '<!DOCTYPE HTML>', right: '<!DOCTYPE html>', explanation: 'The doctype should be lowercase.' },
    { title: 'Using Non-Standard Attributes', wrong: '<input type="text" customAttr="value">', right: '<input type="text" data-custom-attr="value">', explanation: 'Use data-* attributes for non-standard properties.' },
    { title: 'Forgetting to Close a Tag', wrong: '<div>This is a div', right: '<div>This is a div</div>', explanation: 'All tags must be properly closed.' },
    { title: 'Using Block Element as Inline', wrong: '<span class="container">This should be in a div</span>', right: '<div class="container">This should be in a div</div>', explanation: 'Use appropriate block or inline elements.' }
  ];

  challenge: Challenge = {
    title: 'Create a Simple HTML Page',
    language: 'html',
    description: 'Create an HTML page with a header, a paragraph, and an image.',
    hints: ['Start with the doctype declaration.', 'Use &lt;head&gt; for meta tags.', 'Use &lt;body&gt; for content.'],
    starterCode: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  
</body>
</html>`,
    solution: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <header>
    <h1>Welcome to My Page</h1>
  </header>
  This is a paragraph.
  <img src="image.jpg" alt="Description of the image">
</body>
</html>`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which HTML tag defines the root of an HTML document?',
      options: ['&lt;root&gt;', '&lt;doc&gt;', '&lt;html&gt;', '&lt;page&gt;'],
      answer: 2,
      explanation: '&lt;html&gt; is the root element in an HTML document.'
    },
    {
      q: 'What should be the value of charset attribute in a meta tag?',
      options: ['UTF-8', 'ISO-8859-1', 'ASCII', 'GBK'],
      answer: 0,
      explanation: 'UTF-8 is a widely used character encoding that supports all modern characters.'
    },
    {
      q: 'Which of the following is an example of a void element?',
      options: ['&lt;div&gt;', '&lt;p&gt;', '&lt;br&gt;', '&lt;a&gt;'],
      answer: 2,
      explanation: '&lt;br&gt; is a self-closing tag and does not have a closing tag.'
    },
    {
      q: 'What does it mean when an element is inline?',
      options: ['It starts on a new line.', 'It flows within existing blocks.', 'It defines large sections of the web page.', 'It must be closed with a &lt;/tag&gt;'],
      answer: 1,
      explanation: 'Inline elements flow within existing blocks and do not start on a new line.'
    },
    {
      q: 'Which HTML element is used to define a section in an article?',
      options: ['&lt;header&gt;', '&lt;footer&gt;', '&lt;section&gt;', '&lt;article&gt;'],
      answer: 3,
      explanation: '&lt;article&gt; is used to define a self-contained piece of content.'
    }
  ];

  qna: QnaItem[] = [
    { q: 'Explain the difference between &lt;div&gt; and &lt;p&gt;.', a: '&lt;div&gt; is a block element that creates a new block in the layout, while &lt;p&gt; is an inline element that flows within existing blocks.' },
    { q: 'What happens if you forget to close a tag?', a: 'If you forget to close a tag, the browser may interpret the rest of the content incorrectly, leading to rendering errors or unexpected behavior.' },
    { q: 'Can void elements have attributes?', a: 'No, void elements cannot have attributes. They are self-closing and do not require a closing tag.' },
    { q: 'How does character encoding affect HTML documents?', a: 'Character encoding determines how characters are represented in the document. Incorrect or missing character encoding can cause乱码 or other rendering issues.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTML is the markup language used to structure content on the web.',
    mustKnow: ['HTML elements, attributes, void elements, block vs inline', 'DOCTYPE and character encoding', 'DOM tree and browser parsing process'],
    interviewFocus: ['Common HTML mistakes', 'Advanced HTML features']
  };
}

