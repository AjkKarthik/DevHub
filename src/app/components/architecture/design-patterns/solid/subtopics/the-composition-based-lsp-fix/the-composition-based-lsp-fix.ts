import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Two Different Fixes, Only One Shown',
    points: [
      'The main page\'s own LSP fix for Square/Rectangle is two COMPLETELY UNRELATED classes — <code>Rectangle(width, height)</code> and <code>Square(side)</code> share no code, no interface, nothing. That genuinely solves the substitutability problem (neither can be mistaken for the other anymore), but it is not composition — <code>Square</code> does not HOLD a <code>Rectangle</code> instance anywhere.',
      'Composition specifically means one type contains an INSTANCE of another and delegates to it, rather than either inheriting from it or having no relationship at all. This subtopic builds that third option concretely — useful specifically when a <code>Square</code> genuinely needs to REUSE some of <code>Rectangle</code>\'s own logic (not just its shape), which "two unrelated classes" can\'t offer.',
    ],
  },
  {
    heading: 'When Composition Earns Its Keep Over "Just Don\'t Relate Them"',
    points: [
      'If <code>Rectangle</code> only has a trivial <code>Area</code> calculation (as the main page\'s own example does), duplicating one multiplication into a separate <code>Square</code> class is genuinely simpler than composition — this is exactly why the main page\'s own fix is a reasonable choice for THAT specific example.',
      'Composition earns its keep once <code>Rectangle</code> accumulates MORE behaviour worth reusing — validation, serialization, a <code>Perimeter</code> calculation, geometric transforms — where re-implementing all of it a second time in <code>Square</code> would be real duplication, but inheriting it would still break substitutability the same way the original violation did.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Composition — Square Has-A Rectangle',
    language: 'csharp',
    code: `// Rectangle has grown real behaviour worth reusing —
// re-implementing all of it in a separate Square class would be
// genuine duplication, unlike the main page's own trivial Area-only example.
public class Rectangle(int width, int height)
{
    public int Width  { get; } = width;
    public int Height { get; } = height;
    public int Area      => Width * Height;
    public int Perimeter => 2 * (Width + Height);
    public bool IsValid   => Width > 0 && Height > 0;
}

// Square HAS-A Rectangle internally -- composition, not inheritance.
// It is never usable anywhere a Rectangle is expected (no "is-a"
// relationship at all), so the LSP violation the main page's own
// codeTab demonstrates cannot happen here either.
public class Square
{
    private readonly Rectangle _shape;

    public Square(int side) => _shape = new Rectangle(side, side);

    // Delegates to the contained Rectangle -- reuses its logic
    // without inheriting its type or its mutable width/height API.
    public int Area      => _shape.Area;
    public int Perimeter => _shape.Perimeter;
    public bool IsValid   => _shape.IsValid;

    // A Square-specific concept the Rectangle it wraps never needed.
    public int Side => _shape.Width;   // Width == Height by construction
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose <code>Rectangle</code> later gets a new method, <code>Scale(factor)</code>, that multiplies both <code>Width</code> and <code>Height</code> by <code>factor</code>. Does <code>Square</code> automatically get a working <code>Scale</code> too? What would need to change for it to?',
  hint: 'Check whether composition gives <code>Square</code> AUTOMATIC access to every new member <code>Rectangle</code> gains, the way inheritance would.',
  solution: `// No -- Square does NOT automatically get Scale(). Composition only
// exposes whatever Square's OWN members explicitly delegate to
// _shape; a brand-new Rectangle method isn't visible through Square
// until Square adds its own matching member. And since _shape is
// declared readonly, Square can't just reassign it either -- Scale()
// has to build and return a NEW Square instead of mutating in place:

public Square Scale(int factor) => new Square(Side * factor);

// This is the real trade-off composition makes versus inheritance:
// inheritance would have given Square access to Scale() for free
// the moment Rectangle gained it (at the cost of reopening the
// exact substitutability problem the original violation had) --
// composition requires an explicit, deliberate choice for every
// piece of Rectangle's behaviour Square wants to expose, which is
// slower to extend but never risks silently inheriting behaviour
// that breaks Square's own invariants.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>Square</code> internally creates a <code>Rectangle</code> with equal width and height, this is really just inheritance with extra steps.',
    reality: 'The distinction is not cosmetic — with composition, <code>Square</code> is never SUBSTITUTABLE for <code>Rectangle</code> anywhere (there is no <code>is Rectangle</code> relationship, no shared base type, nothing a method expecting a <code>Rectangle</code> parameter could accept). With the ORIGINAL inheritance-based violation, code accepting a <code>Rectangle</code> parameter COULD receive a <code>Square</code> and be surprised when setting <code>Width</code> silently changed <code>Height</code> too. Composition eliminates that surprise entirely by never offering the substitution in the first place.',
  },
  {
    thought: 'Composition is always the "more correct" LSP fix, so the main page\'s own separate-unrelated-classes version is a lesser solution.',
    reality: 'For the main page\'s OWN specific example — a trivial one-line <code>Area</code> calculation — composition adds a layer of indirection (a contained instance, delegating properties) for no real reuse benefit, since there is barely any behaviour worth sharing. The right choice genuinely depends on how much of the base type\'s behaviour is worth reusing: trivial behaviour favors two separate types; substantial, real behaviour favors composition. Neither is universally more correct.',
  },
];

@Component({
  selector: 'app-dp-solid-lsp-composition',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-composition-based-lsp-fix.html',
  styleUrl: './the-composition-based-lsp-fix.scss',
})
export class TheCompositionBasedLspFixSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
