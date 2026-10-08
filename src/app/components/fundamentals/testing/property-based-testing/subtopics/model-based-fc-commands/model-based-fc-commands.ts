import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-model-based-fc-commands',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './model-based-fc-commands.html',
  styleUrl: './model-based-fc-commands.scss'
})
export class ModelBasedFcCommandsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Sequences of operations as input",
      "points": [
        "A plain property gets values as input. A model-based property gets a random sequence of operations, runs each on the real system and on a simple model, and checks they agree after every step.",
        "In fast-check each operation is a command object with <code>check(model)</code> (is it allowed now) and <code>run(model, real)</code> (apply it to both and compare). <code>fc.commands([...])</code> generates sequences and <code>fc.modelRun</code> executes one.",
        "Measured with fast-check 4.10, seed 1: a correct <code>BoundedStack</code> with capacity 3 passed. A buggy version that checked <code>length &lt;= cap</code> instead of <code>&lt; cap</code> failed, and the sequence shrank to <code>push(0), push(0), push(0), push(0)</code>.",
        "That shrunk sequence is the whole bug report: the fourth push into a stack of capacity 3 should be ignored, and the real stack grew to 4 while the model stayed at 3."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Commands and model",
      "language": "typescript",
      "code": "import fc from 'fast-check';\n\ntype Model = number[];\n\nclass PushCmd implements fc.Command<Model, BoundedStack> {\n  constructor(readonly v: number) {}\n  check() { return true; }\n  run(m: Model, r: BoundedStack) {\n    if (m.length < 3) m.push(this.v);\n    r.push(this.v);\n    expect(r.size()).toBe(m.length);\n  }\n  toString() { return 'push(' + this.v + ')'; }\n}\n\nclass PopCmd implements fc.Command<Model, BoundedStack> {\n  check(m: Readonly<Model>) { return m.length > 0; }\n  run(m: Model, r: BoundedStack) { expect(r.pop()).toBe(m.pop()); }\n  toString() { return 'pop'; }\n}"
    },
    {
      "label": "The property",
      "language": "typescript",
      "code": "const commands = [\n  fc.integer().map(v => new PushCmd(v)),\n  fc.constant(new PopCmd()),\n];\n\ntest('BoundedStack behaves like a capped array', () => {\n  fc.assert(fc.property(fc.commands(commands, { maxCommands: 20 }), cmds => {\n    fc.modelRun(() => ({ model: [], real: new BoundedStack(3) }), cmds);\n  }));\n});\n\n// Buggy push (length <= cap) shrinks to:\n// push(0),push(0),push(0),push(0)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why does the shrunk failure contain four pushes and no pops, when the generator could produce both?",
    "hint": "Shrinking removes every command that is not needed to reproduce the failure.",
    "solution": "The bug only shows up when a push happens on a full stack, so the shortest failing sequence is three pushes to fill it and one more to overflow it. Pops cannot help and only delay filling the stack, so the shrinker removes them. Values shrink to 0 because the value does not matter."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Model-based tests need a second full implementation to compare against.",
      "reality": "The model only needs to be obviously correct, not efficient. A plain array is enough to model a stack or a queue."
    },
    {
      "thought": "Random operation sequences make failures hard to read.",
      "reality": "Shrinking cuts the sequence down to the few operations that still fail, which is usually easier to read than a hand-written bug report."
    }
  ];
}
