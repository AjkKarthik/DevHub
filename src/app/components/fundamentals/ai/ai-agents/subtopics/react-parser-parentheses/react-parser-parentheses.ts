import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-react-parser-parentheses',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './react-parser-parentheses.html',
  styleUrl: './react-parser-parentheses.scss'
})
export class ReactParserParenthesesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run in Node",
      "points": [
        "<code>'calculate({\"expression\":\"(2+3)*4\"})'.split('(')</code> produced three pieces. Destructuring kept <code>calculate</code> and <code>{\"expression\":\"</code>, and dropped the rest.",
        "Slicing off the last character and parsing gave <code>Unexpected end of JSON input</code>.",
        "Using <code>indexOf('(')</code> for the start and <code>lastIndexOf(')')</code> for the end gave the tool name <code>calculate</code> and the arguments <code>{ expression: \"(2+3)*4\" }</code>.",
        "The page's ReAct tab now uses the first and last parenthesis."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Parse an action",
      "language": "typescript",
      "code": "function parseAction(action: string): { tool: string; args: unknown } {\n  const open = action.indexOf('(');\n  const close = action.lastIndexOf(')');\n  if (open < 0 || close < open) throw new Error('Malformed action: ' + action);\n  return {\n    tool: action.slice(0, open).trim(),\n    args: JSON.parse(action.slice(open + 1, close)),\n  };\n}\n\nparseAction('calculate({\"expression\":\"(2+3)*4\"})');\n// { tool: 'calculate', args: { expression: '(2+3)*4' } }"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The model writes an Action line followed by a comment: calculate({\"expression\":\"2*3\"}) (to check the total). Does parseAction still work?",
    "hint": "Where is the last ) now?",
    "solution": "No. The last ) is at the end of the comment, so the slice includes \") (to check the total\" and JSON.parse fails. Ask for one action per line with nothing after it, or use native tool calling."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "split('(') gives the name and the arguments.",
      "reality": "It splits at every parenthesis, including those inside the arguments."
    },
    {
      "thought": "Text ReAct and native tool calling are equally robust.",
      "reality": "Native tool calling returns parsed arguments; text formats need hand-written parsing like this."
    }
  ];
}
