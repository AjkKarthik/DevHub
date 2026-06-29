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
  templateUrl: './drag-drop.html',
  styleUrl: './drag-drop.scss'
})
export class HtmlDragDrop {

quickRef: QuickRefItem[] = [
    { name: 'draggable', type: 'keyword', desc: 'Indicates that an element is draggable.' },
    { name: 'dragstart', type: 'method', desc: 'Fired when the user starts dragging an element.' },
    { name: 'drag', type: 'method', desc: 'Fired while the user is dragging an element.' },
    { name: 'dragenter', type: 'method', desc: 'Fired when a draggable element enters a valid drop target.' },
    { name: 'dragover', type: 'method', desc: 'Fired as the draggable element is dragged over a valid drop target.' },
    { name: 'drop', type: 'method', desc: 'Fired when an element is dropped on a valid drop target.' },
    { name: 'dragend', type: 'method', desc: 'Fired when the user finishes dragging an element.' },
    { name: 'effectAllowed', type: 'keyword', desc: 'Specifies what types of drag-and-drop operations are allowed.' }
];

theory: TheoryPoint[] = [
    {
        heading: 'Draggable Attribute',
        points: [
            '<code>draggable="true"</code> makes an element draggable.',
            '<code>draggable="false"</code> prevents an element from being dragged.'
        ]
    },
    {
        heading: 'Drag Event Sequence',
        points: [
            ' dragstart - When the drag operation starts.',
            ' drag - While dragging.',
            ' dragenter - When entering a valid drop target.',
            ' dragover - During the drag over a drop target.',
            ' drop - On releasing the mouse button on a valid drop target.',
            ' dragend - When the drag operation ends.'
        ]
    },
    {
        heading: 'DataTransfer Object',
        points: [
            ' <code>dataTransfer.setData(type, data)</code> to set data for a type.',
            ' <code>dataTransfer.getData(type)</code> to get data for a type.',
            ' <code>dataTransfer.clearData([type])</code> to clear the data.'
        ]
    },
    {
        heading: 'EffectAllowed and DropEffect',
        points: [
            '<code>effectAllowed="copy"</code>, <code>effectAllowed="move"</code>, etc.',
            '<code>dropEffect="none"</code>, <code>dropEffect="copy"</code>, <code>dropEffect="link"</code>, etc.'
        ]
    },
    {
        heading: 'Visual Feedback',
        points: [
            'Use CSS to style elements during drag operations.',
            'Add classes based on drag events for visual feedback.'
        ]
    }
];

codeTabs: CodeTab[] = [
    {
        label: 'HTML',
        language: 'html',
        code: `
<div>
  <div draggable="true" id="draggable">Drag me!</div>
  <div id="dropzone"></div>
</div>
`
    },
    {
        label: 'JavaScript',
        language: 'typescript',
        code: `
document.getElementById('draggable').addEventListener('dragstart', function(event) {
  event.dataTransfer.setData('text/plain', 'Dragged Element');
});

document.getElementById('dropzone').addEventListener('dragover', function(event) {
  event.preventDefault();
});

document.getElementById('dropzone').addEventListener('drop', function(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData('text/plain');
  this.innerHTML = data;
});
`
    },
    {
        label: 'CSS',
        language: 'css',
        code: `
#draggable {
  width: 100px;
  height: 100px;
  background-color: lightblue;
}

#dropzone {
  width: 200px;
  height: 200px;
  border: 2px dashed black;
}
`
    }
];

mistakes: CommonMistake[] = [
    {
        title: 'Misusing draggable attribute',
        wrong: '<div draggable="false">Drag me!</div>',
        right: '<div>Drag me!</div>',
        explanation: 'The <code>draggable</code> attribute should be used to make an element draggable, not to prevent it.'
    },
    {
        title: 'Incorrect use of dataTransfer',
        wrong: `event.dataTransfer.setData('text/plain', 'data');`,
        right: `event.dataTransfer.setData('text/plain', 'Dragged Element');`,
        explanation: 'The correct data should be set using <code>setData</code>.'
    },
    {
        title: 'Lacking dragover event handler',
        wrong: `<div id="dropzone"></div>`,
        right: `<div id="dropzone"></div>`,
        explanation: 'A drop zone should have a dragover event handler to allow dropping.'
    },
    {
        title: 'Incorrect effectAllowed value',
        wrong: '<div draggable="true" effectAllowed="move">Drag me!</div>',
        right: '<div draggable="true" effectAllowed="copy">Drag me!</div>',
        explanation: 'The <code>effectAllowed</code> attribute should be set to a valid type.'
    }
];

challenge: Challenge = {
    title: 'Create a Simple Drag-and-Drop',
    language: 'html',
    description: 'Create an HTML page with a draggable element and a drop zone. When the draggable element is dropped on the drop zone, it should replace the content of the drop zone.',
    hints: [
        'Use the <code>draggable</code> attribute to make an element draggable.',
        'Add an event listener for <code>dragstart</code>, <code>dragover</code>, and <code>drop</code> events on the drop zone.'
    ],
    starterCode: `
<div>
  <div id="draggable" draggable="true">Drag me!</div>
  <div id="dropzone"></div>
</div>
`,
    solution: `
document.getElementById('draggable').addEventListener('dragstart', function(event) {
  event.dataTransfer.setData('text/plain', 'Dragged Element');
});

document.getElementById('dropzone').addEventListener('dragover', function(event) {
  event.preventDefault();
});

document.getElementById('dropzone').addEventListener('drop', function(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData('text/plain');
  this.innerHTML = data;
});
`
};

quiz: QuizQuestion[] = [
    {
        q: 'Which attribute is used to make an element draggable?',
        options: ['draggable', 'allowDrag', 'enableDrag'],
        answer: 0,
        explanation: '<code>draggable="true"</code> makes an element draggable.'
    },
    {
        q: 'What event is fired when the user starts dragging an element?',
        options: ['dragstart', 'dragend', 'dragenter'],
        answer: 0,
        explanation: 'The <code>dragstart</code> event is fired when the drag operation starts.'
    },
    {
        q: 'Which method is used to set data for a type in the dataTransfer object?',
        options: ['setData', 'setDataType', 'storeData'],
        answer: 0,
        explanation: '<code>dataTransfer.setData(type, data)</code> sets data for a type.'
    },
    {
        q: 'What CSS class should be added to an element during drag operations for visual feedback?',
        options: ['dragging', 'beingDragged', 'activeDrag'],
        answer: 0,
        explanation: 'A custom class can be used, such as <code>dragging</code>, to apply styles during drag operations.'
    },
    {
        q: 'Which value of the effectAllowed attribute allows both copy and move operations?',
        options: ['copy', 'move', 'all'],
        answer: 2,
        explanation: '<code>effectAllowed="all"</code> allows both copy and move operations.'
    },
    {
        q: 'Which dataTransfer method sets data to be passed to the drop target?',
        options: ['dataTransfer.addData()', 'dataTransfer.setData(type, data)', 'dataTransfer.pass(data)', 'event.data = value'],
        answer: 1,
        explanation: 'dataTransfer.setData("text/plain", value) stores data during dragstart. The drop handler retrieves it with dataTransfer.getData("text/plain"). Multiple types can be set for different target compatibility.',
    }
];

qna: QnaItem[] = [
    {
        q: 'What is the difference between <code>effectAllowed</code> and <code>dropEffect</code>?',
        a: '<code>effectAllowed</code> specifies what types of drag-and-drop operations are allowed, while <code>dropEffect</code> specifies the effect that will occur when an item is dropped.'
    },
    {
        q: 'How can you prevent the default action in a dragover event?',
        a: 'Call <code>event.preventDefault()</code> to prevent the default action in a dragover event.'
    },
    {
        q: 'What should be returned in the solution code of this challenge?',
        a: '<code>document.getElementById(\'dropzone\').innerHTML = data;</code>'
    },
    {
        q: 'How do you make drag-and-drop accessible to keyboard users?',
        a: 'The HTML5 Drag and Drop API has no keyboard equivalent — keyboard users cannot use it without extra work. Solutions: (1) add keyboard handlers (Space to pick up, arrow keys to move, Enter/Space to drop) as a parallel interaction path, (2) provide an alternative UI (an "Up/Down" button pair for list reordering), or (3) use a library that abstracts both. Screen readers also cannot follow drag operation progress — announce state changes with ARIA live regions.',
    },
    {
        q: 'What is the difference between dragenter and dragover events?',
        a: 'dragenter fires once when the drag first enters an element. dragover fires continuously while the dragged item is over the element (many times per second). You must call preventDefault() on dragover (not just dragenter) to allow dropping. Use dragenter to apply a visual "accepting drop" style; use dragover to call preventDefault(). Remove the style on dragleave or drop.',
    },
    {
        q: 'How do you prevent a drop target from accepting all types of dragged content?',
        a: 'Check dataTransfer.types in the dragover handler and only call preventDefault() for accepted types: <code>if (e.dataTransfer.types.includes("text/plain")) e.preventDefault()</code>. You can also check dataTransfer.items for file drops. Without this check, your drop zone accepts any dragged element on the page — including images, links, and text from other apps.',
    }
];

revision: RevisionSummary = {
    oneLiner: 'Learned about Drag & Drop API and its application.',
    mustKnow: ['draggable attribute', 'drag events', 'dataTransfer object', 'effectAllowed and dropEffect'],
    interviewFocus: ['Implementing drag-and-drop functionality in a web application', 'Handling drag events for user interactions']
};
}
