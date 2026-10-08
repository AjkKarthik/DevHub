import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-jest30-removed-aliases',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './jest30-removed-aliases.html',
  styleUrl: './jest30-removed-aliases.scss'
})
export class Jest30RemovedAliasesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Which names still exist",
      "points": [
        "In Jest 30's <code>expect</code> (30.5 checked), these are undefined: <code>toThrowError</code>, <code>toBeCalled</code>, <code>toBeCalledTimes</code>, <code>toBeCalledWith</code>, <code>lastCalledWith</code>, <code>nthCalledWith</code>, <code>toReturn</code>, <code>toReturnTimes</code>, <code>toReturnWith</code>, <code>lastReturnedWith</code>, <code>nthReturnedWith</code>.",
        "Their full names are all present: <code>toThrow</code>, <code>toHaveBeenCalled</code>, <code>toHaveBeenCalledTimes</code>, <code>toHaveBeenCalledWith</code>, <code>toHaveBeenLastCalledWith</code>, <code>toHaveBeenNthCalledWith</code>, <code>toHaveReturned</code> and so on.",
        "The Jest Fundamentals QnA recommended <code>.toThrowError(ErrorClass)</code>, and the Testing cheat sheet used <code>toThrowError(\"Expected message\")</code>. Both now use <code>toThrow</code>, which accepts the same arguments: a string, a RegExp, an error class or an error object.",
        "Older blog posts and Stack Overflow answers use the short names heavily, which is why copied tests break after a Jest 30 upgrade."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Old and new names",
      "language": "typescript",
      "code": "// Removed in Jest 30          -> use instead\n// toThrowError(x)               -> toThrow(x)\n// toBeCalled()                  -> toHaveBeenCalled()\n// toBeCalledTimes(n)            -> toHaveBeenCalledTimes(n)\n// toBeCalledWith(...)           -> toHaveBeenCalledWith(...)\n// lastCalledWith(...)           -> toHaveBeenLastCalledWith(...)\n// nthCalledWith(n, ...)         -> toHaveBeenNthCalledWith(n, ...)\n// toReturn() / toReturnWith(x)  -> toHaveReturned() / toHaveReturnedWith(x)"
    },
    {
      "label": "toThrow covers every case",
      "language": "typescript",
      "code": "expect(() => parse('{bad}')).toThrow();                 // any error\nexpect(() => parse('{bad}')).toThrow('Unexpected token');  // message contains\nexpect(() => parse('{bad}')).toThrow(/token/);            // message matches\nexpect(() => parse('{bad}')).toThrow(SyntaxError);       // error class"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "After upgrading to Jest 30, a test file fails with <code>TypeError: expect(...).toBeCalledWith is not a function</code>. Why does the error not say anything about the assertion itself, and how do you find every other place with the same problem?",
    "hint": "The matcher is missing before any comparison can happen.",
    "solution": "The call fails because the method no longer exists, so Jest never compares any arguments. Search the codebase for the removed names (toBeCalled, toBeCalledWith, lastCalledWith, toThrowError, toReturn...) or enable the eslint-plugin-jest no-alias-methods rule, which reports and auto-fixes them."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>toThrowError</code> checks the error type while <code>toThrow</code> only checks that something was thrown.",
      "reality": "They were aliases with identical behaviour. <code>toThrow(SomeErrorClass)</code> checks the type."
    },
    {
      "thought": "Deprecated aliases keep working with a warning.",
      "reality": "In Jest 30 they were removed, so calls fail with \"is not a function\"."
    }
  ];
}
