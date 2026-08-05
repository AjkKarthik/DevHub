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
    heading: 'A Caveat Easy to Skim Past',
    points: [
      'The main page\'s own theory states, among the conditions for using Flyweight: "object identity is not ' +
      'important — two objects with the same intrinsic state are interchangeable." That caveat is describing ' +
      'the FLYWEIGHT itself (the shared <code>ParticleType</code>) — but it is easy to misread as applying to ' +
      'the CONTAINING object too (the <code>Particle</code> that references it).',
      'The main page\'s own <code>Particle</code> record has real per-instance identity (its own X, Y, Scale) ' +
      '— two Particle instances are NOT interchangeable just because they happen to share the same ' +
      '<code>ParticleType</code>. Code that accidentally compares or keys off the SHARED ' +
      '<code>ParticleType</code> reference when it means to distinguish individual particles silently merges ' +
      'logically distinct objects together.',
    ],
  },
  {
    heading: 'How This Actually Happens in Code',
    points: [
      'A natural-looking but wrong shortcut: tracking "which particles are selected/highlighted" using a ' +
      '<code>HashSet&lt;ParticleType&gt;</code> instead of <code>HashSet&lt;Particle&gt;</code> — since ' +
      '<code>ParticleType</code> is a Flyweight, EVERY particle of that type shares the exact same reference, ' +
      'so "selecting" one particle of a given type silently selects every OTHER particle sharing that type ' +
      'too.',
      'This bug is especially easy to introduce specifically BECAUSE Flyweight was applied correctly — the ' +
      'sharing that makes the pattern memory-efficient is the exact same sharing that causes the bug when a ' +
      'caller reaches for the wrong object to track identity with.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Bug — Selecting by Shared Flyweight Reference',
    language: 'csharp',
    code: `// Using the main page's own Particle / ParticleType shapes.
public class ParticleSelection
{
    // BUG: keyed by the SHARED flyweight, not the individual particle.
    private readonly HashSet<ParticleType> _selected = new();

    public void Select(Particle p) => _selected.Add(p.Type);
    public bool IsSelected(Particle p) => _selected.Contains(p.Type);
}

var factory = new ParticleFactory();
var fireType = factory.Get("fire.png", "red", "circle");

var particleA = new Particle(fireType, x: 10, y: 10, scale: 1.0f);
var particleB = new Particle(fireType, x: 500, y: 500, scale: 1.0f); // a totally
                                                                       // different particle,
                                                                       // same flyweight

var selection = new ParticleSelection();
selection.Select(particleA);

// particleB was never selected — but because it shares fireType with
// particleA, this returns TRUE. Selecting ANY fire particle silently
// selects EVERY fire particle in the whole simulation.
Console.WriteLine(selection.IsSelected(particleB)); // true — WRONG`,
  },
  {
    label: 'The Fix — Track by the Individual Object, Not Its Flyweight',
    language: 'csharp',
    code: `public class ParticleSelection
{
    // Track the PARTICLE itself — Particle is a record, so this
    // correctly distinguishes particleA from particleB even though
    // both reference the exact same fireType flyweight.
    private readonly HashSet<Particle> _selected = new();

    public void Select(Particle p) => _selected.Add(p);
    public bool IsSelected(Particle p) => _selected.Contains(p);
}

var selection = new ParticleSelection();
selection.Select(particleA);

Console.WriteLine(selection.IsSelected(particleA)); // true — correct
Console.WriteLine(selection.IsSelected(particleB)); // false — correct,
                                                       // despite sharing fireType

// Note: this works because Particle is a RECORD — records get
// value-based equality/hashing over ALL their fields (including X, Y,
// Scale) for free, so two particles at different positions naturally
// hash and compare as different, even while pointing at the identical
// ParticleType reference.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>Particle</code> were a plain <code>class</code> instead of a <code>record</code> (with no ' +
    'overridden <code>Equals()</code>/<code>GetHashCode()</code>), would the FIXED version above (using ' +
    '<code>HashSet&lt;Particle&gt;</code>) still work correctly? Why or why not?',
  hint:
    'Think about what HashSet actually uses to decide whether two entries are "the same" when no custom ' +
    'equality is defined — and whether that default happens to already be what you want here.',
  solution:
    'Yes, it would still work correctly, for a slightly different reason than with the record. A plain class ' +
    'with no overridden Equals()/GetHashCode() falls back to REFERENCE equality by default — HashSet<Particle> ' +
    'would treat particleA and particleB as different entries because they are two distinct object references ' +
    'on the heap, exactly the distinction the fix needs, even without any custom equality logic. The record\'s ' +
    'value-based equality (comparing X, Y, Scale, and Type) is a stronger guarantee — it would also correctly ' +
    'treat two SEPARATELY-constructed particles with identical field values as equal, which reference equality ' +
    'alone would not — but for THIS specific bug (distinguishing genuinely different particle instances), ' +
    'either default is sufficient, since neither one collapses down to comparing just the shared ParticleType.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page\'s own "identity is not important" theory point is simply wrong, since this ' +
      'subtopic shows identity mattering after all.',
    reality:
      'The theory point is correct as written — it describes the FLYWEIGHT (ParticleType), where identity ' +
      'genuinely does not matter: any two ParticleType instances with the same texture/color/shape are fully ' +
      'interchangeable, by design. The bug shown here comes from applying that same "identity doesn\'t matter" ' +
      'reasoning to the wrong object — the Particle, whose identity (position, individual selection state) ' +
      'very much does matter, even though it happens to reference an interchangeable flyweight.',
  },
  {
    thought: 'Since ParticleType instances are shared, comparing them with == is always a mistake.',
    reality:
      'Comparing ParticleType references is exactly the right tool for a different, legitimate question — ' +
      '"do these two particles look the same?" (same texture, color, shape) rather than "are these two ' +
      'particles the same individual entity?" Both questions are valid; the bug is using the shared-type ' +
      'comparison to answer the individual-identity question by mistake, not that comparing flyweight ' +
      'references is inherently wrong.',
  },
];

@Component({
  selector: 'app-flyweight-when-flyweight-identity-merges-distinct-objects',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './when-flyweight-identity-merges-distinct-objects.html',
  styleUrl: './when-flyweight-identity-merges-distinct-objects.scss',
})
export class WhenFlyweightIdentityMergesDistinctObjectsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
