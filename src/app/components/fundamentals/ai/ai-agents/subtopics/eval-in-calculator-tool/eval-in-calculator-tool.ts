import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-eval-in-calculator-tool',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './eval-in-calculator-tool.html',
  styleUrl: './eval-in-calculator-tool.scss'
})
export class EvalInCalculatorToolSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run in Node",
      "points": [
        "With the original code, the input <code>globalThis.pwned = 1, 2+2</code> returned \"4\" and also set a global variable. Any JavaScript in the expression runs with the agent process's permissions.",
        "The agent decides the expression, and the agent reads web search results in the same context. Text in a search result can tell it what to put in the calculate call.",
        "The fixed tool first checks the expression against <code>^[\\d\\s+\\-*/().]+$</code> (digits, spaces, operators, parentheses). Without letters there are no identifiers, so no function or variable can be reached.",
        "Results after the fix: <code>(2+3)*4</code> gave 20, <code>2/3</code> gave 0.6667, <code>require(\"fs\")</code> and the global-variable input were refused, and <code>2+*</code> returned \"invalid expression\"."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Safe calculate",
      "language": "typescript",
      "code": "function calculate(expr: string): string {\n  // Digits, whitespace, + - * / . and parentheses only\n  if (!/^[\\d\\s+\\-*/().]+$/.test(expr)) return 'Error: only arithmetic is allowed';\n  try { return String(Function('\"use strict\"; return (' + expr + ');')()); }\n  catch { return 'Error: invalid expression'; }\n}\n\ncalculate('(2+3)*4');                 // '20'\ncalculate('globalThis.pwned = 1, 2+2'); // 'Error: only arithmetic is allowed'\ncalculate('2+*');                     // 'Error: invalid expression'"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A teammate wants to allow Math.sqrt in the calculator by adding letters to the allowed characters. What is the risk, and what is a safer approach?",
    "hint": "Once letters are allowed, which names can the expression reach?",
    "solution": "Allowing letters lets the expression name any global (process, globalThis, Function), so the check no longer protects anything. Instead parse the expression with a small math parser that only knows a fixed list of functions, or accept sqrt as a separate tool argument."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Tool input comes from my own model, so it is trusted.",
      "reality": "The model writes whatever the context steers it toward, including injected instructions from tool results."
    },
    {
      "thought": "try/catch around eval makes it safe.",
      "reality": "try/catch only handles errors; code that runs successfully still runs."
    }
  ];
}
