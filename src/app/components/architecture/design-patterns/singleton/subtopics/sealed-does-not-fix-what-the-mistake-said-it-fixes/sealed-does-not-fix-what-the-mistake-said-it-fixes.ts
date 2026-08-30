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
  templateUrl: './sealed-does-not-fix-what-the-mistake-said-it-fixes.html',
  styleUrl: './sealed-does-not-fix-what-the-mistake-said-it-fixes.scss'
})
export class SealedDoesNotFixWhatTheMistakeSaidItFixesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A claimed bypass that C# does not actually allow',
      points: [
        'The page\'s own "Not sealing the class" mistake originally explained the risk this way: "A non-sealed class allows subclasses to call the private base constructor through their own constructor, creating additional instances."',
        'This is not how C# access modifiers work. A <code>private</code> constructor is accessible ONLY within the declaring class itself — an external class, in a different file or a different assembly, has no way to call it. The C# compiler rejects any attempt: a derived class outside <code>Database</code> has no accessible base constructor to call, full stop.',
        'This means the ORIGINAL scenario the mistake described — an ordinary external subclass bypassing a private constructor — was never actually possible with the code shown. The class already being non-<code>sealed</code> changes nothing about this, since the private constructor itself is what blocks it.',
      ]
    },
    {
      heading: 'What sealed actually guards against',
      points: [
        'The real value of <code>sealed</code> here is defensive against a FUTURE edit, not a bypass that exists in the code as written today: if a maintainer later widens the constructor from <code>private</code> to <code>protected</code> (a plausible change — maybe to support a test subclass, or a specialized variant), an unsealed class silently becomes inheritable the moment that edit lands. <code>sealed</code> makes that widening a compile error instead of a silent contract break.',
        'There is one narrower case a private constructor genuinely does NOT block: a class NESTED inside the Singleton itself. In C#, a nested type has access to ALL private members of its enclosing type — including a private constructor — so a nested class could inherit from its own enclosing Singleton and construct additional instances. <code>sealed</code> closes this specific gap.',
        'Neither of these is the scenario the original mistake described (an ordinary external subclass "bypassing" the constructor via <code>base()</code>) — that scenario simply does not compile, with or without <code>sealed</code>.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually happens when you try the described bypass',
      language: 'csharp',
      code: `public class Database
{
    public static Database Instance { get; } = new();
    private Database() { }
}

// ATTEMPTED BYPASS -- in a different file, a different class entirely
public class RogueDatabase : Database
{
    // CS1729 / CS0122: 'Database.Database()' is inaccessible due to
    // its protection level -- this does not compile, sealed or not.
    // The compiler never lets this class exist in the first place.
}

// THE CASE sealed ACTUALLY PREVENTS -- a class nested INSIDE Database
public class Database2
{
    public static Database2 Instance { get; } = new();
    private Database2() { }

    // Nested classes DO have access to the enclosing type's private
    // members -- including the private constructor. This COMPILES:
    private class InnerBypass : Database2 { }
    // sealed on Database2 would turn this into a compile error too.
}

// THE CASE sealed GUARDS AGAINST FOR THE FUTURE
public class Database3   // <-- forgot 'sealed'
{
    public static Database3 Instance { get; } = new();
    protected Database3() { }   // <-- someone later widened this from
}                                //     private to protected...

public class CustomDatabase : Database3 { }  // ...and NOW this compiles,
// silently breaking the single-instance contract, on a class that was
// never sealed to catch it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Since a private constructor already blocks subclassing, sealed on a Singleton is purely cosmetic and doesn\'t actually prevent anything." Is that a fair summary?',
    hint: 'Does a private constructor protect against every way a Singleton class could END UP being subclassed — including changes made LATER, and classes nested inside it?',
    solution: 'Not quite -- "purely cosmetic" overstates it. It is true that sealed does not prevent anything an ORDINARY external subclass could do TODAY, since the private constructor already blocks that. But sealed genuinely does prevent two real things: a nested class inside the Singleton inheriting from it (nested types can access private members of their enclosing type, so this actually compiles without sealed), and a FUTURE maintainer widening the constructor from private to protected without realizing that silently reopens subclassing on an unsealed class. Both are narrower and less dramatic than "any subclass can bypass it," but neither is purely cosmetic -- they are real, if uncommon, risks that sealed genuinely closes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An external subclass can call a private base-class constructor through its own constructor, as long as the derived class provides one.',
      reality: 'Per this subtopic\'s theory, this is not how C# access modifiers work — a private constructor is inaccessible outside its declaring class entirely, and the compiler rejects any external subclass attempting to inherit from a class with only a private constructor.'
    },
    {
      thought: 'Since a private constructor already blocks external subclassing, adding sealed to a Singleton class serves no real purpose.',
      reality: 'Per this subtopic\'s theory, sealed still closes two real gaps a private constructor alone does not: a nested class inside the Singleton (which DOES have access to private members of its enclosing type), and a future edit that widens the constructor\'s accessibility.'
    },
    {
      thought: 'If a mistake or quiz explanation on this page describes a specific language mechanism, it can be trusted as accurate without independently verifying the claim.',
      reality: 'Per this subtopic\'s theory, this specific claim was checked against actual C# access-modifier semantics and found to describe a scenario that does not compile — a reminder that language-mechanism claims are worth verifying independently, the same discipline applied to every other technical claim on this site.'
    }
  ];
}
