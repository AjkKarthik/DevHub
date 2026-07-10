import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-stylesheet-create-doesnt-replace-react-memo-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './stylesheet-create-doesnt-replace-react-memo.html',
  styleUrl: './stylesheet-create-doesnt-replace-react-memo.scss',
})
export class StylesheetCreateDoesntReplaceReactMemoSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "Stability" Claim That Is Easy to Over-Generalize',
      points: [
        'Mistake #2\'s explanation says StyleSheet.create() "creates the object once, validates it in development, and gives it an integer ID — layout recalculations are skipped when the ID has not changed." The word "stable" here refers specifically to what the NATIVE layout engine sees — the main page never claims this also makes a component memo-safe, but the phrasing is close enough to that idea that it is worth checking explicitly.',
        'This subtopic checks that boundary directly: does a component wrapped in <code>React.memo</code>, receiving a StyleSheet.create() style as one of its props, actually skip re-rendering when its parent re-renders — or does StyleSheet.create()\'s stability only help at a layer React.memo never even looks at?',
      ],
    },
    {
      heading: 'Two Separate Layers, Two Separate Optimizations',
      points: [
        'StyleSheet.create()\'s stable integer ID is consumed by the NATIVE side (Yoga/Fabric) — when a native view receives the same style ID it already has, the native layout engine can skip recomputing that view\'s layout. This happens regardless of whether the JS-side React component re-rendered at all.',
        'React.memo operates entirely on the JS side, one layer up — it compares the PROPS passed into a component (using Object.is by default) and skips calling the component function again if every prop is reference-equal to last time. StyleSheet.create()\'s style objects being stable IS one thing React.memo\'s shallow comparison can correctly see as "unchanged" — but only if that style value is actually a PROP being passed in, and only if every OTHER prop is also stable.',
        'A component that receives a stable StyleSheet.create() style as a prop, but ALSO receives a fresh inline object, a fresh arrow function, or a fresh array literal as another prop on every parent render, still fails React.memo\'s comparison and re-renders every time — the style ID stability does nothing to protect against instability anywhere else in the same props object.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Stable style ID — but the component still re-renders every time',
      language: 'typescript',
      code: `import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 8 },
});

const ProductRow = memo(function ProductRow({
  name,
  onPress,       // <-- a NEW function every parent render
}: { name: string; onPress: () => void }) {
  console.log('ProductRow rendered:', name);
  return (
    <View style={styles.row}>
      <Text>{name}</Text>
    </View>
  );
});

function ProductList({ products }: { products: { id: string; name: string }[] }) {
  return (
    <>
      {products.map(p => (
        // A fresh arrow function literal every render -- memo's
        // shallow comparison sees a DIFFERENT onPress reference
        // every time, so ProductRow re-renders regardless of how
        // stable styles.row is.
        <ProductRow key={p.id} name={p.name} onPress={() => handlePress(p.id)} />
      ))}
    </>
  );
}`,
    },
    {
      label: 'What actually fixes it — stabilize EVERY prop, not just style',
      language: 'typescript',
      code: `import { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 8 },
});

const ProductRow = memo(function ProductRow({
  id,
  name,
  onPress,
}: { id: string; name: string; onPress: (id: string) => void }) {
  console.log('ProductRow rendered:', name);
  return (
    <View style={styles.row}>
      <Text onPress={() => onPress(id)}>{name}</Text>
    </View>
  );
});

function ProductList({ products }: { products: { id: string; name: string }[] }) {
  // ONE stable function reference, not one fresh closure per row.
  const handlePress = useCallback((id: string) => {
    console.log('pressed', id);
  }, []);

  return (
    <>
      {products.map(p => (
        // Now EVERY prop is stable: name (string, primitive), id
        // (string, primitive), onPress (stable useCallback ref) --
        // memo's shallow comparison finally has something to work
        // with. styles.row's own stability was necessary but never
        // sufficient on its own.
        <ProductRow key={p.id} id={p.id} name={p.name} onPress={handlePress} />
      ))}
    </>
  );
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A memo-wrapped ProductCard receives <code>style={styles.card}</code> (from StyleSheet.create) and <code>badges={["new", "sale"]}</code> (a fresh array literal built inline in the parent\'s render). Does StyleSheet.create() prevent unnecessary re-renders here?',
    hint: 'React.memo shallow-compares EVERY prop. Does a stable style prop change what happens to a completely separate, unstable badges prop?',
    solution: `No — ProductCard still re-renders on every parent render, because
React.memo's shallow comparison checks ALL props, and the badges
array is a fresh reference every single time (["new", "sale"] is a
new array literal, even though its contents are identical).

styles.card being stable means THAT specific prop passes the
comparison — but memo requires EVERY prop to be reference-equal to
skip the re-render, not just some of them. One unstable prop is
enough to defeat the whole check, regardless of how many other props
are perfectly stable.

The fix has nothing to do with StyleSheet.create() at all -- it
requires stabilizing the badges array itself, either by memoizing it
in the parent (useMemo(() => ["new", "sale"], [])) or, more robustly,
deriving it from actual stable data rather than a literal recreated
on every render.

This is the core point of this subtopic: StyleSheet.create() solves
ONE specific instability (style objects) at ONE specific layer
(native layout). It was never a general "make this component
memo-safe" tool, and treating it as one leaves every OTHER prop's
stability unaddressed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'using StyleSheet.create() for a component\'s styles is sufficient to make React.memo effectively skip re-renders for that component.',
      reality: 'React.memo requires EVERY prop to be reference-stable, not just the style prop. A stable StyleSheet.create() style sitting alongside a fresh inline function, array, or object prop still fails memo\'s comparison entirely.',
    },
    {
      thought: 'StyleSheet.create()\'s "stable integer ID" optimization and React.memo\'s prop comparison are the same mechanism, just described differently by the main page.',
      reality: 'they are two separate optimizations at two separate layers — StyleSheet.create()\'s ID is consumed by the NATIVE layout engine (Yoga/Fabric) to skip re-layout; React.memo\'s comparison happens entirely on the JS side to decide whether to re-run a component function at all.',
    },
    {
      thought: 'if a component only ever receives StyleSheet.create() styles and primitive props (strings, numbers), StyleSheet.create() is what makes memo effective here.',
      reality: 'in that specific case, memo IS effective — but the credit belongs to the primitives being naturally reference-stable (value-compared by Object.is), not to StyleSheet.create() itself, which only ever addressed the style value specifically.',
    },
  ];
}
