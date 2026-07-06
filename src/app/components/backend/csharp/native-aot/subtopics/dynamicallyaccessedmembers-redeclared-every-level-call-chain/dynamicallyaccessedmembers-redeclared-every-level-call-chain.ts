import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dynamicallyaccessedmembers-redeclared-every-level-call-chain-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dynamicallyaccessedmembers-redeclared-every-level-call-chain.html',
  styleUrl: './dynamicallyaccessedmembers-redeclared-every-level-call-chain.scss',
})
export class DynamicallyAccessedMembersRedeclaredEveryLevelCallChainSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s example shows [DynamicallyAccessedMembers] on a SINGLE method — real code usually has a CHAIN of wrappers, and the annotation does not propagate automatically',
      points: [
        'The main Native AOT page\'s <code>ServiceFactory.Create&lt;T&gt;()</code> example shows <code>[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)]</code> directly on the generic parameter of the ONE method that calls <code>Activator.CreateInstance&lt;T&gt;()</code>. This works perfectly for that single method — but real applications rarely call the reflection-using method directly; more often, it is wrapped by one or more layers of helper methods, and EACH layer needs its own explicit annotation.',
      ],
    },
    {
      heading: 'The trimmer analyzes each method\'s requirements independently — it does not infer that a CALLER of an annotated method also needs the same annotation',
      points: [
        'When the trimmer sees a call to a method whose generic parameter is annotated <code>[DynamicallyAccessedMembers(PublicConstructors)]</code>, it checks: does the TYPE ARGUMENT at THIS call site come from a context where public constructors are already guaranteed to be preserved? If the caller\'s OWN generic parameter (the one being forwarded) has NO annotation of its own, the trimmer cannot prove that guarantee holds, and emits an IL2091 warning ("does not satisfy DynamicallyAccessedMembersAttribute requirements") — even though, at runtime with JIT, the code might work perfectly fine (since JIT never trims anything).',
        'This means the annotation must be repeated, explicitly, at EVERY level of a call chain where a generic type parameter is forwarded toward the eventually-reflected type — forgetting it at even ONE intermediate level breaks the chain of proof the trimmer needs, even if the OUTERMOST and INNERMOST methods are both correctly annotated.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s single-method example — this alone is fine',
      language: 'csharp',
      code: `using System.Diagnostics.CodeAnalysis;

public static class ServiceFactory
{
    [RequiresDynamicCode("Uses Activator.CreateInstance")]
    [RequiresUnreferencedCode("T must be preserved for reflection")]
    public static T Create<[DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicConstructors)] T>()
        where T : class
        => Activator.CreateInstance<T>();
}

// Called DIRECTLY like this, the trimmer is fully satisfied — the
// concrete type argument (MyService) at the CALL SITE is known
// statically, so its public constructors are preserved:
var service = ServiceFactory.Create<MyService>();`,
    },
    {
      label: 'The trap — a wrapper method that forwards T WITHOUT re-declaring the annotation',
      language: 'csharp',
      code: `// A team adds a convenience wrapper around ServiceFactory.Create<T>,
// intending it to behave identically:
public static class ServiceLocator
{
    // BUG: T here has NO [DynamicallyAccessedMembers] annotation at all —
    // this compiles fine under JIT, and even RUNS fine under JIT, but
    // is a genuine trim-analysis gap:
    public static T Resolve<T>() where T : class
        => ServiceFactory.Create<T>();
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // IL2091: 'T' generic parameter does not satisfy
    // 'DynamicallyAccessedMemberTypes.PublicConstructors' in call to
    // 'ServiceFactory.Create<T>()'. The generic parameter 'T' of
    // 'ServiceLocator.Resolve<T>()' does not have matching annotations.
}

// Even though the OUTERMOST call site still passes a concrete,
// statically-known type:
var service = ServiceLocator.Resolve<MyService>();
// ...the WARNING fires at the ServiceLocator.Resolve<T> DEFINITION,
// not at this call site — because the trimmer analyzes Resolve<T>'s
// OWN body in isolation, and from ITS perspective, T could be ANY
// type at ANY call site anywhere in the program, some of which might
// not have preserved public constructors at all.`,
    },
    {
      label: 'The fix — re-declare the SAME annotation at every forwarding level',
      language: 'csharp',
      code: `public static class ServiceLocator
{
    // FIX: repeat the EXACT SAME [DynamicallyAccessedMembers] annotation
    // on THIS method's own generic parameter — this is what actually
    // tells the trimmer "whatever T is here, its public constructors
    // are guaranteed preserved," satisfying ServiceFactory.Create<T>'s
    // own requirement when Resolve<T> forwards T to it:
    public static T Resolve<
        [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] T>()
        where T : class
        => ServiceFactory.Create<T>();  // now satisfied — no IL2091
}

// A THIRD layer, wrapping ServiceLocator.Resolve<T>, needs the SAME
// annotation AGAIN — this is not a one-time cost paid once anywhere
// in the chain, it must be repeated at literally every level that
// forwards the type parameter toward the reflection call:
public static class DiContainer
{
    public static T GetService<
        [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] T>()
        where T : class
        => ServiceLocator.Resolve<T>();  // satisfied — annotation present here too
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A four-level call chain (<code>PluginHost.Load&lt;T&gt;</code> → <code>PluginRegistry.Get&lt;T&gt;</code> → <code>ServiceLocator.Resolve&lt;T&gt;</code> → <code>ServiceFactory.Create&lt;T&gt;</code>) has the annotation correctly present on the FIRST and LAST methods, but missing on the middle two. Explain exactly how many IL2091 warnings this produces and at which methods they appear.',
    hint: 'Consider that the trimmer checks each METHOD DEFINITION\'s own call sites independently — a method with a missing annotation on ITS OWN generic parameter produces a warning at the point where IT calls the next method in the chain, regardless of whether methods further up or down the chain are correctly annotated.',
    solution: `// The chain, with annotations only at the ends:
public static class ServiceFactory
{
    public static T Create<[DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicConstructors)] T>() where T : class
        => Activator.CreateInstance<T>();
}

public static class ServiceLocator
{
    // MISSING annotation here:
    public static T Resolve<T>() where T : class
        => ServiceFactory.Create<T>();
    // ^ IL2091 warning #1 — Resolve<T>'s own T has no annotation, but
    // it calls Create<T> which REQUIRES one. This warning fires HERE,
    // at Resolve's OWN definition, regardless of what PluginRegistry
    // (which calls Resolve) looks like.
}

public static class PluginRegistry
{
    // MISSING annotation here too:
    public static T Get<T>() where T : class
        => ServiceLocator.Resolve<T>();
    // ^ IL2091 warning #2 — Get<T>'s own T has no annotation, but it
    // calls Resolve<T>, which (from the PREVIOUS level's fix perspective)
    // would ALSO need Get's T to be annotated to satisfy IT — this is a
    // SEPARATE, independent warning from warning #1, not a consequence
    // of it. Note that even if warning #1 were somehow fixed WITHOUT
    // touching Get<T>, warning #2 would remain, because the trimmer
    // checks Get<T>'s call to Resolve<T> based on Resolve's DECLARED
    // signature requirements, not Resolve's internal implementation.
}

public static class PluginHost
{
    public static T Load<[DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicConstructors)] T>() where T : class
        => PluginRegistry.Get<T>();
    // ^ IL2091 warning #3 — Load<T> IS correctly annotated, but it calls
    // Get<T>, which (as defined above) has NO annotation, so the
    // trimmer cannot prove Get<T>'s requirement (none declared, but
    // Get internally needs one to satisfy Resolve) lines up — actually,
    // more precisely: since Get<T> has no [DynamicallyAccessedMembers]
    // of its own, calling it imposes NO requirement on the CALLER
    // (Load<T>) to provide anything special — Load<T>'s own correct
    // annotation goes UNUSED here, silently, rather than producing a
    // warning at this specific call site. The THIRD warning that DOES
    // fire is at Get<T>'s call into Resolve<T> (warning #2 above) —
    // there are exactly TWO IL2091 warnings total, one at Resolve<T>'s
    // definition and one at Get<T>'s definition — NOT three, because a
    // method with NO annotation calling ANOTHER method requiring one
    // is where the actual proof gap lives, not at a correctly-annotated
    // caller invoking an unannotated method (that direction is merely
    // a missed opportunity to propagate a real guarantee, not a broken
    // one). The key lesson: warnings appear at EVERY level where an
    // UNANNOTATED method's own generic parameter is forwarded into a
    // call requiring the annotation — exactly two such gaps exist here
    // (Resolve and Get), so exactly two warnings fire, independent of
    // PluginHost's own correct top-level annotation.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'annotating the innermost method that actually calls Activator.CreateInstance (or another reflection API) with [DynamicallyAccessedMembers] is sufficient — the trimmer will figure out the rest of the call chain automatically.',
      reality: 'the trimmer analyzes each method definition independently; every intermediate method that forwards a generic type parameter toward the reflection call must re-declare the exact same [DynamicallyAccessedMembers] annotation on its own generic parameter, or a warning fires at that specific method.',
    },
    {
      thought: 'if the outermost, top-level call site passes a concrete, statically-known type (like MyService), the trimmer is automatically satisfied no matter how many unannotated wrapper methods sit in between.',
      reality: 'the trimmer warnings fire at each unannotated intermediate METHOD DEFINITION based on that method\'s own generic parameter, independent of what concrete type any outer call site eventually supplies — the analysis is per-method-signature, not per-call-site-resolution.',
    },
    {
      thought: 'IL2091 warnings only matter if the code will actually run under Native AOT — if the app still uses JIT, these warnings are purely cosmetic and can be ignored.',
      reality: 'a JIT-run app never trims anything, so the underlying reflection genuinely works regardless of missing annotations — but the warnings exist specifically to catch code that WILL break the moment someone eventually enables PublishAot, which is exactly the scenario these annotations are meant to prevent discovering late.',
    },
  ];
}
