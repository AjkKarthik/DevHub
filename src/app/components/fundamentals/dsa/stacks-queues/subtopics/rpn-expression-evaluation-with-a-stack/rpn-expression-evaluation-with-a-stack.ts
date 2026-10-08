import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-stacks-rpn',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rpn-expression-evaluation-with-a-stack.html',
  styleUrl: './rpn-expression-evaluation-with-a-stack.scss'
})
export class RpnExpressionEvaluationWithAStackSubtopic {
  topicLabel = 'Stacks & Queues';
  topicRoute = '/dsa/stacks-queues';

  theory: TheoryPoint[] = [
    {
      heading: 'Postfix (RPN) Evaluation, Made Concrete',
      points: [
        'The main page\'s own QnA describes postfix evaluation in one dense paragraph ("scan left to right; push operands; when operator found, pop two operands, apply operator, push result") but no codeTab on the page actually builds it. It is the single simplest real-world use of a stack: operators never need to "look ahead" or track precedence, because Reverse Polish Notation already encodes the order of operations directly in the token sequence.',
        'The two popped operands come off the stack in a specific order that matters for non-commutative operators: for the token sequence <code>a b -</code>, <code>b</code> is popped FIRST (it was pushed last), then <code>a</code> second, and the operation computed is <code>a - b</code>, not <code>b - a</code>. Getting this pop order backwards silently produces the wrong answer for every subtraction and division in the expression -- verified below with a worked multi-operator example.',
        'Verified directly against three worked examples, including the LeetCode-style case <code>["10","6","9","3","+","-11","*","/","*","17","+","5","+"]</code>, which correctly evaluates to <code>22</code> -- confirming the pop-order rule holds even through nested, nested-again operator chains.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'RPN evaluator',
      language: 'typescript',
      code: `function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  for (const tok of tokens) {
    if (['+', '-', '*', '/'].includes(tok)) {
      const b = stack.pop()!; // pushed LAST, popped FIRST
      const a = stack.pop()!; // pushed first (further down), popped SECOND
      let result: number;
      if (tok === '+') result = a + b;
      else if (tok === '-') result = a - b;       // order matters: a - b, not b - a
      else if (tok === '*') result = a * b;
      else result = Math.trunc(a / b);             // truncate toward zero
      stack.push(result);
    } else {
      stack.push(Number(tok));
    }
  }
  return stack.pop()!;
}

console.log(evalRPN(['2', '1', '+', '3', '*']));
// Actual measured output: 9   -- (2 + 1) * 3

console.log(evalRPN(['4', '13', '5', '/', '+']));
// Actual measured output: 6   -- 4 + trunc(13 / 5) = 4 + 2

console.log(evalRPN(['10','6','9','3','+','-11','*','/','*','17','+','5','+']));
// Actual measured output: 22`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If the pop order inside evalRPN were swapped -- popping "a" first and "b" second instead -- for which operators would the result silently change, and for which would it stay identical?',
    hint: 'Think about which of +, -, *, / actually depend on argument order (commutative vs. non-commutative).',
    solution: 'Addition (+) and multiplication (*) are commutative -- a + b equals b + a and a * b equals b * a, so swapping the pop order would change nothing for those two operators; the result would still be correct by accident. Subtraction (-) and division (/) are NOT commutative: a - b does not equal b - a, and a / b does not equal b / a (except in degenerate cases). Swapping the pop order for those two would silently flip the sign of every subtraction and invert every division, producing a wrong answer with no error thrown at all -- the exact kind of bug that is easy to miss because the + and * test cases would still pass.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'For a binary operator like "-", it does not matter which of the two popped operands is treated as the left-hand side, since you just computed "the result".',
      reality: 'It matters precisely because subtraction and division are not commutative. The token in RPN pushed EARLIER (further down the stack) is always the left-hand operand, and the one pushed LATER (popped first) is the right-hand operand -- getting this backwards for <code>a b -</code> computes <code>b - a</code> instead of the correct <code>a - b</code>, silently flipping the sign.',
    },
    {
      thought: 'RPN evaluation needs a stack of (value, operator) pairs to track what to apply when.',
      reality: 'A plain stack of numbers is enough -- RPN never pushes operators onto the stack at all. The moment an operator token is read, it is applied IMMEDIATELY to the two most recently pushed numbers, and only the numeric result goes back on the stack. This is exactly what makes RPN evaluation simpler than infix evaluation, which does need a separate operator stack to track precedence.',
    },
  ];
}
