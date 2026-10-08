import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-jest-fn-is-usually-a-spy',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './jest-fn-is-usually-a-spy.html',
  styleUrl: './jest-fn-is-usually-a-spy.scss'
})
export class JestFnIsUsuallyASpySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Where the two definitions differ",
      "points": [
        "In Gerard Meszaros' xUnit Test Patterns, used by Martin Fowler in \"Mocks Aren't Stubs\", a test spy records how it was called so the test can assert on it after the act step. A mock object is told what calls to expect before the act and verifies those calls itself.",
        "The page's logger test created <code>{ log: jest.fn() }</code>, ran the code, and then asserted <code>toHaveBeenCalledWith(\"Order: WIDGET x3 = 30\")</code>. Nothing was pre-programmed. That is a spy, so the comment \"Mock: pre-programmed expectation\" described the other pattern.",
        "The confusion comes from Jest's own naming: <code>jest.fn()</code> and <code>jest.spyOn()</code> both create \"mock functions\". The practical difference is that <code>spyOn</code> wraps a method that already exists on an object, and <code>jest.fn()</code> is standalone.",
        "The page's comment and its \"Confusing a spy with a mock\" mistake now say this directly. Its summary list still defines a mock as \"pre-programmed expectations, self-verifies\", which is the correct Meszaros definition."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Spy (record, then assert)",
      "language": "typescript",
      "code": "const logger = { log: jest.fn() };\n\nnew OrderProcessor(priceStub, logger).process('WIDGET', 3);   // act\n\nexpect(logger.log).toHaveBeenCalledWith('Order: WIDGET x3 = 30'); // verify afterwards"
    },
    {
      "label": "Classic mock (expect first)",
      "language": "typescript",
      "code": "// Sinon: the expectation is declared BEFORE the act and checked by the mock\nimport sinon from 'sinon';\n\nconst logger = { log(msg: string) {} };\nconst mock = sinon.mock(logger);\nmock.expects('log').once().withArgs('Order: WIDGET x3 = 30');\n\nnew OrderProcessor(priceStub, logger).process('WIDGET', 3);\n\nmock.verify();   // throws if the expectation was not met"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test does <code>const save = jest.fn().mockReturnValue(true)</code>, passes it in, calls the code, and then asserts <code>expect(save).toHaveBeenCalledTimes(1)</code>. Using the Meszaros terms, which roles is <code>save</code> playing?",
    "hint": "One part of the setup gives the code an answer; one part of the test checks what happened.",
    "solution": "Two roles at once. mockReturnValue(true) gives the code a canned answer, which is the stub role. The toHaveBeenCalledTimes(1) assertion after the act is the spy role. It is not a mock in the Meszaros sense because no expectation was declared before the act."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Anything created with <code>jest.fn()</code> is a mock object.",
      "reality": "Jest calls it a mock function, but the test-double role depends on how you use it: canned answers make it a stub, after-the-fact call assertions make it a spy."
    },
    {
      "thought": "Spies must call the real implementation.",
      "reality": "Recording calls is what makes a spy. <code>jest.spyOn</code> calls through by default, but a spy with <code>mockImplementation</code> is still a spy."
    }
  ];
}
