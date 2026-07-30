import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './handler-repo-field-never-declared.html',
  styleUrl: './handler-repo-field-never-declared.scss'
})
export class HandlersRepoFieldNeverDeclaredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A method call on a field the class never declared',
      points: [
        'The Challenge solution\'s PlaceOrderHandler class originally read: async handle(cmd) { ...; await this.repo.save(order); } — calling .save() on this.repo — but the class had NO constructor and NO field declaration for repo anywhere. At runtime, this.repo would be undefined, and calling .save() on it throws a TypeError. The page has been corrected to add a constructor that declares and injects repo.',
        'This is catchable purely by reading the class definition top to bottom: every property the class body USES should be DECLARED somewhere (a field, a constructor parameter property, or inherited) — repo appears only in the method body, nowhere else.',
      ]
    },
    {
      heading: 'Why this specific gap is easy to miss while reading, harder to miss while running',
      points: [
        'Reading the solution top-to-bottom, the code "looks" complete: it constructs an Order, adds lines, confirms it, and persists it — the shape of a correct Application-layer handler. The missing piece (an undeclared field) only becomes obvious when actually trying to RUN the code or compile it with TypeScript\'s strict mode, which would report "Property \'repo\' does not exist on type \'PlaceOrderHandler\'."',
        'The page\'s OWN earlier "Application Layer Handler" code sample (in the main topic\'s theory section, not the Challenge) gets this exactly right: constructor(private orders: IOrderRepository, private catalog: ICatalogService) {} — declaring orders as a constructor parameter property before using this.orders.save(order) in the method body. The Challenge solution\'s omission is inconsistent with the page\'s own correct pattern shown earlier.',
      ]
    },
    {
      heading: 'The fix, and why it matters for a "reference solution" specifically',
      points: [
        'The fix adds a constructor: constructor(private repo: IOrderRepository) {} — using TypeScript\'s parameter property shorthand (private repo: ...) to both declare the field and assign it from the constructor argument in one step, matching the exact pattern the page\'s own earlier, correct example already uses.',
        'A "reference solution" to a Challenge carries more weight than an illustrative snippet elsewhere on the page — a learner attempting the same Challenge is likely to compare their own answer against this exact code, and a solution with an undeclared field could make a learner doubt their own (possibly more correct) implementation, or copy the same bug into their own code.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Undeclared field vs. constructor parameter property',
      language: 'typescript',
      code: `// BEFORE: this.repo is used but never declared anywhere in the class.
class PlaceOrderHandlerBroken {
  async handle(cmd: PlaceOrderCommand): Promise<void> {
    const order = new Order(generateId());
    for (const l of cmd.lines) order.addLine(l.product, l.qty);
    order.confirm();
    await this.repo.save(order);
    // TypeScript (strict mode): Property 'repo' does not exist on
    // type 'PlaceOrderHandlerBroken'.
    // At runtime (if it somehow compiled): this.repo is undefined,
    // so .save() throws "Cannot read properties of undefined".
  }
}

// AFTER: constructor parameter property declares AND assigns repo
// in one step -- matching the page's own earlier, correct example.
class PlaceOrderHandlerFixed {
  constructor(private repo: IOrderRepository) {}

  async handle(cmd: PlaceOrderCommand): Promise<void> {
    const order = new Order(generateId());
    for (const l of cmd.lines) order.addLine(l.product, l.qty);
    order.confirm();
    await this.repo.save(order); // repo is now a real, declared field
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A class is defined as: class PlaceOrderHandler { async handle(cmd) { const order = new Order(generateId()); ...; await this.repo.save(order); } } -- with no constructor and no field declaration anywhere else in the class. What happens when handle() runs, and what is the minimal fix?',
    hint: 'Search the entire class body for anywhere "repo" is declared as a field or constructor parameter, separate from where it\'s USED inside the handle() method.',
    solution: 'There is no declaration of repo anywhere in the class -- only a USE of this.repo inside handle(). In TypeScript strict mode, this fails to compile at all ("Property \'repo\' does not exist"). If it somehow ran anyway, this.repo would be undefined at runtime, and calling .save() on undefined throws a TypeError. The minimal fix is adding a constructor using TypeScript\'s parameter property shorthand: constructor(private repo: IOrderRepository) {} -- this both declares repo as a class field and assigns it from the constructor argument in a single line, exactly matching the pattern the page\'s own earlier "Application Layer Handler" example already demonstrates correctly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A code sample that reads correctly from top to bottom -- constructing an object, calling its methods, persisting the result -- is very unlikely to have a field-declaration bug, since that class of error would be obvious on a careful read.',
      reality: 'Per this subtopic\'s theory, this exact bug survived a plausible-looking read specifically BECAUSE the missing piece (a field declaration) is absent, not wrong -- there\'s no incorrect line to spot, only a line that should exist but doesn\'t, which requires checking for what ISN\'T there rather than what is.'
    },
    {
      thought: 'A "reference solution" to a Challenge is held to a lower bar of scrutiny than a main topic-page code sample, since its job is just to sketch the shape of a correct answer.',
      reality: 'Per this subtopic\'s theory, a reference solution arguably deserves MORE scrutiny than an illustrative snippet — a learner comparing their own Challenge attempt against it is likely to trust it as the canonical correct answer, so an undeclared-field bug there is more consequential than the same bug in a passing example elsewhere.'
    },
    {
      thought: 'Since generateId() is also called in the same solution without being declared or imported anywhere, this is the same category of bug as the this.repo issue, and both need the identical fix.',
      reality: 'Per this subtopic\'s theory, these are meaningfully different: generateId() is a bare function call that reasonably reads as "assume this utility exists elsewhere," a common and generally acceptable simplification in illustrative code (similar to other pages on this site referencing db/redis/stripe as assumed globals) — while this.repo is a property access on the class instance itself with zero declaration anywhere in the class, a stricter and more clear-cut compile-time error.'
    }
  ];
}
