import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-native',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './native.html',
  styleUrl: './native.scss',
})
export class ReactNative {
  quickRef: QuickRefItem[] = [
    { name: '<View>',                type: 'syntax',   desc: 'Fundamental container — maps to UIView (iOS) / android.view.View (Android). Supports flexbox.' },
    { name: '<Text>',                type: 'syntax',   desc: 'All text must be inside <Text>. Supports nesting for inline styling.' },
    { name: '<ScrollView>',          type: 'syntax',   desc: 'Scrollable container. Renders all children at once — use FlatList for long lists.' },
    { name: '<FlatList>',            type: 'syntax',   desc: 'Virtualised list — only renders visible items. Requires data + renderItem props.' },
    { name: 'StyleSheet.create({})', type: 'function', desc: 'Define styles as a typed object. Validated at dev time; no CSS — uses flexbox + RN-specific props.' },
    { name: '<Pressable>',           type: 'syntax',   desc: 'Modern touch target. Replaces TouchableOpacity. Provides pressed state via children function.' },
    { name: '<TextInput>',           type: 'syntax',   desc: 'Text input field. Controlled via value + onChangeText. No onChange like web.' },
    { name: '<Image>',               type: 'syntax',   desc: 'Render images. Remote: source={{ uri }}. Local: source={require("./img.png")}.' },
    { name: 'useNavigation()',       type: 'hook',     desc: 'Access the React Navigation navigator inside a component. navigate(), goBack(), push().' },
    { name: 'Platform.OS',           type: 'accessor', desc: '"ios" | "android" | "web". Use Platform.select({}) for platform-specific values.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'React Native fundamentals — no HTML, no CSS',
      points: [
        '<strong>React Native renders native UI components</strong>, not HTML. Every web element has an RN equivalent: div → View, p/span → Text, img → Image, input → TextInput, button → Pressable. There is no DOM.',
        '<strong>All layout is flexbox</strong>, and it defaults to <code>flexDirection: "column"</code> (opposite of web CSS which defaults to row). No CSS cascade — styles are scoped to components via StyleSheet objects.',
        '<strong>All text must be wrapped in &lt;Text&gt;</strong>. Placing raw strings directly inside a View causes a crash in production builds. Nest Text components for inline styling.',
        '<strong>Expo</strong> is the recommended starting point. It provides a managed workflow (Expo Go app for testing, no Xcode/Android Studio needed initially), a rich library ecosystem, and EAS Build for production binaries.',
      ],
    },
    {
      heading: 'Layout with flexbox and StyleSheet',
      points: [
        '<strong>StyleSheet.create()</strong> validates style properties at development time and gives TypeScript auto-complete. Never write inline style objects — they create new objects on every render and bypass validation.',
        '<strong>flex: 1</strong> expands a component to fill available space along the main axis. In a column layout, this means full height. In a row layout, full width. The parent must have a defined size for flex: 1 to have effect.',
        '<strong>Key differences from CSS:</strong> no units (all values are dp — density-independent pixels); no margin shorthand (use marginTop, marginHorizontal); no display: none (use conditional rendering instead); backgroundColor not background.',
        '<strong>Absolute positioning</strong> works the same as CSS. <code>position: "absolute"</code> takes an element out of flow; use top/right/bottom/left to place it. Common for overlays, badges, and floating action buttons.',
      ],
    },
    {
      heading: 'React Navigation',
      points: [
        '<strong>React Navigation</strong> is the standard routing library. A NavigationContainer wraps the app. Inside it, choose a navigator type: Stack (push/pop), Tab (bottom tabs), Drawer (hamburger menu).',
        '<strong>Stack Navigator</strong> (<code>createNativeStackNavigator</code>) provides iOS/Android native push animations. Define screens with <code>Stack.Screen name="..." component={...}</code>.',
        '<strong>Typed navigation</strong>: define a RootStackParamList type mapping screen names to their params. Pass it to useNavigation<NativeStackNavigationProp<RootStackParamList, "Detail">>() for fully typed navigation.',
        '<strong>Tab + Stack combination:</strong> wrap a Stack inside each Tab.Screen to get independent stacks per tab (the standard mobile app pattern). The nested navigator inherits the parent\'s NavigationContainer.',
      ],
    },
    {
      heading: 'Platform-specific code and New Architecture',
      points: [
        '<strong>Platform.OS</strong> returns "ios" | "android" | "web". <strong>Platform.select()</strong> returns a value based on the platform: <code>Platform.select({ ios: 44, android: 56 })</code>. Use for margins, font sizes, and shadows.',
        '<strong>Platform-specific files:</strong> create <code>Button.ios.tsx</code> and <code>Button.android.tsx</code> — RN automatically picks the right file at bundle time. Cleaner than inline Platform.select for large differences.',
        '<strong>New Architecture (Fabric + JSI)</strong> is stable from RN 0.76. Fabric is the new C++ renderer (replaces the JS-to-native bridge); JSI (JavaScript Interface) allows synchronous JS↔native calls. Expo 52+ enables New Architecture by default.',
        '<strong>Hermes JS engine</strong> is the default for both iOS and Android. It pre-compiles to bytecode, reducing startup time significantly. Never disable Hermes in new projects.',
      ],
    },
    {
      heading: 'Expo workflow and key APIs',
      points: [
        '<strong>Expo Router</strong> (file-based routing) is the modern approach for Expo apps — it mirrors Next.js App Router conventions and supports web too. <code>app/(tabs)/index.tsx</code> maps to the home tab.',
        '<strong>Expo SDK APIs:</strong> expo-camera (device camera + barcode), expo-location (GPS), expo-notifications (push), expo-image-picker (photo library), expo-secure-store (Keychain/Keystore equivalent of localStorage).',
        '<strong>AsyncStorage</strong> (via @react-native-async-storage/async-storage) is the key-value storage for non-sensitive data. Async API — always await. For sensitive data (tokens), use expo-secure-store.',
        '<strong>React Native Reanimated 3</strong> is the standard animation library. Runs animations on the UI thread via worklets — smooth even when the JS thread is busy. Pairs with react-native-gesture-handler for gesture-driven animations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core components',
      language: 'typescript',
      code: `import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';

function ProductCard({ title, price, imageUri }: { title: string; price: number; imageUri: string }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => setPressed(p => !p)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>\${price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}    // RN: onChangeText not onChange
        placeholder="Search products…"
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        clearButtonMode="while-editing"   // iOS only — shows clear ×
      />
      <ScrollView>
        {['Widget', 'Gadget', 'Doohickey'].filter(p =>
          p.toLowerCase().includes(query.toLowerCase())
        ).map(p => (
          <Text key={p} style={styles.item}>{p}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input:     { height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  card:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, elevation: 2,
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardPressed: { opacity: 0.7 },
  image:     { width: 80, height: 80, borderRadius: 8 },
  info:      { flex: 1, marginLeft: 12, justifyContent: 'center' },
  title:     { fontSize: 16, fontWeight: '600', color: '#111827' },
  price:     { fontSize: 14, color: '#0ea5e9', marginTop: 4 },
  item:      { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
});`,
    },
    {
      label: 'FlatList + Platform',
      language: 'typescript',
      code: `import { FlatList, View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';

interface Product { id: string; name: string; category: string; price: number; }

function ProductList({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) return <ActivityIndicator size="large" color="#0ea5e9" style={{ flex: 1 }} />;

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      renderItem={({ item, index }) => (
        <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>\${item.price}</Text>
        </View>
      )}
      // Performance props
      getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}   // fixed height
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews    // unmount offscreen items on Android
      // UX props
      ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      ListHeaderComponent={<Text style={styles.header}>Products ({products.length})</Text>}
      contentContainerStyle={{ paddingBottom: 80 }}   // space for tab bar
      showsVerticalScrollIndicator={false}
    />
  );
}

// Platform-specific styling
const styles = StyleSheet.create({
  row:    { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  rowAlt: { backgroundColor: '#f9fafb' },
  name:   { flex: 1, fontSize: 15 },
  price:  { fontSize: 14, color: '#0ea5e9' },
  empty:  { textAlign: 'center', padding: 32, color: '#6b7280' },
  header: {
    padding: 16,
    fontWeight: '700',
    fontSize: 18,
    paddingTop: Platform.OS === 'android' ? 16 : 12,  // platform-specific spacing
  },
});`,
    },
    {
      label: 'React Navigation',
      language: 'typescript',
      code: `import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ──── Type the navigation params ──────────────────────────────
type RootStackParamList = {
  Home:   undefined;
  Detail: { productId: string; productName: string };
  Modal:  undefined;
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// ──── Screens ──────────────────────────────────────────────────
function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  return (
    <View>
      <Button title="View Widget" onPress={() =>
        navigation.navigate('Detail', { productId: '1', productName: 'Widget' })
      } />
    </View>
  );
}

function DetailScreen() {
  const route = useRoute<any>();
  const { productId, productName } = route.params;
  return <Text>{productName} (ID: {productId})</Text>;
}

// ──── Tab navigator wrapping stack navigators ─────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator();

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0ea5e9' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Home"   component={HomeScreen}   options={{ title: 'Products' }} />
      <Stack.Screen name="Detail" component={DetailScreen} options={({ route }) => ({ title: route.params.productName })} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#0ea5e9', headerShown: false }}>
        <Tab.Screen name="Shop"    component={ShopStack} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}`,
    },
    {
      label: 'AsyncStorage + SecureStore',
      language: 'typescript',
      code: `import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';

// ──── AsyncStorage (non-sensitive) ────────────────────────────
async function saveSettings(settings: { theme: string; fontSize: number }) {
  await AsyncStorage.setItem('app-settings', JSON.stringify(settings));
}

async function loadSettings() {
  const raw = await AsyncStorage.getItem('app-settings');
  return raw ? JSON.parse(raw) : null;
}

// ──── Custom hook wrapping AsyncStorage ───────────────────────
function useAsyncStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    AsyncStorage.getItem(key).then(raw => {
      if (raw) setValue(JSON.parse(raw));
    });
  }, [key]);

  async function set(next: T) {
    setValue(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }

  return [value, set] as const;
}

// ──── SecureStore (tokens, passwords — Keychain/Keystore) ─────
async function saveToken(token: string) {
  await SecureStore.setItemAsync('auth-token', token);
}

async function getToken() {
  return SecureStore.getItemAsync('auth-token');
}

async function deleteToken() {
  await SecureStore.deleteItemAsync('auth-token');
}

// ──── Usage in a login flow ────────────────────────────────────
function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    getToken().then(t => { setToken(t); setLoading(false); });
  }, []);

  async function login(email: string, password: string) {
    const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const { token } = await response.json();
    await saveToken(token);
    setToken(token);
  }

  async function logout() {
    await deleteToken();
    setToken(null);
  }

  return { token, loading, login, logout, isAuthenticated: !!token };
}`,
    },
    {
      label: 'Expo Router + Reanimated',
      language: 'typescript',
      code: `// ──── Expo Router file layout ────────────────────────────────
// app/
//   _layout.tsx          ← root layout (NavigationContainer)
//   (tabs)/
//     _layout.tsx        ← Tab.Navigator config
//     index.tsx          ← /  (home tab)
//     profile.tsx        ← /profile tab
//   product/
//     [id].tsx           ← /product/123 (dynamic)
//   +not-found.tsx       ← 404

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0ea5e9' }}>
      <Tabs.Screen name="index"   options={{ title: 'Home'    }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

// app/product/[id].tsx
import { useLocalSearchParams, router } from 'expo-router';

export default function ProductPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Product {id}</Text>
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}

// ──── React Native Reanimated 3 ────────────────────────────────
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

function AnimatedCard() {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPressIn  ={() => { scale.value = withSpring(0.95); opacity.value = withTiming(0.8); }}
      onPressOut ={() => { scale.value = withSpring(1);    opacity.value = withTiming(1);   }}
    >
      <Animated.View style={[styles.card, animStyle]}>
        <Text>Press me!</Text>
      </Animated.View>
    </Pressable>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ScrollView for long lists',
      wrong: `// ScrollView renders ALL items at once — crashes on 1000+ items
<ScrollView>
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</ScrollView>`,
      right: `// FlatList virtualises — only visible items rendered
<FlatList
  data={products}
  keyExtractor={p => p.id}
  renderItem={({ item }) => <ProductCard product={item} />}
  getItemLayout={(_, i) => ({ length: 80, offset: 80 * i, index: i })}
/>`,
      explanation: 'ScrollView mounts every child immediately. For 500+ items this causes severe initial lag and high memory use. FlatList only renders visible rows — performance stays constant regardless of list size.',
    },
    {
      title: 'Inline StyleSheet objects (creating new references on every render)',
      wrong: `// New object every render — defeats React.memo, causes extra work
function Button({ label }: { label: string }) {
  return <Pressable style={{ padding: 12, borderRadius: 8, backgroundColor: '#0ea5e9' }}>
    <Text style={{ color: '#fff', fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}`,
      right: `const styles = StyleSheet.create({
  btn:  { padding: 12, borderRadius: 8, backgroundColor: '#0ea5e9' },
  text: { color: '#fff', fontWeight: '700' },
});
function Button({ label }: { label: string }) {
  return <Pressable style={styles.btn}><Text style={styles.text}>{label}</Text></Pressable>;
}`,
      explanation: 'Inline style objects are new references on every render. StyleSheet.create() creates the object once, validates it in development, and gives it an integer ID — layout recalculations are skipped when the ID has not changed.',
    },
    {
      title: 'Using TouchableOpacity instead of Pressable',
      wrong: `// TouchableOpacity is legacy — limited pressed state, no ripple control
<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
  <Text>Press me</Text>
</TouchableOpacity>`,
      right: `// Pressable is the modern replacement — full pressed state, composable styles
<Pressable onPress={handlePress} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
  <Text>Press me</Text>
</Pressable>`,
      explanation: 'Pressable (added in RN 0.63) replaces TouchableOpacity, TouchableHighlight, and TouchableNativeFeedback. It exposes a pressed state object and supports Android ripple via the android_ripple prop.',
    },
    {
      title: 'Missing keyExtractor on FlatList',
      wrong: `// No keyExtractor — React uses index, causing wrong reconciliation on list updates
<FlatList data={items} renderItem={({ item }) => <Row item={item} />} />`,
      right: `<FlatList
  data={items}
  keyExtractor={item => item.id}   // stable, unique ID from data
  renderItem={({ item }) => <Row item={item} />}
/>`,
      explanation: 'Without keyExtractor, FlatList uses array index as key — the same bug as index keys in React web. Items animate to wrong positions, state is assigned to the wrong row, and removed items cause incorrect DOM diffs.',
    },
    {
      title: 'Storing tokens in AsyncStorage instead of SecureStore',
      wrong: `// AsyncStorage is NOT encrypted — tokens are readable by any app on rooted devices
await AsyncStorage.setItem('auth-token', token);`,
      right: `// expo-secure-store uses iOS Keychain / Android Keystore — hardware-backed encryption
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('auth-token', token);`,
      explanation: 'AsyncStorage is plain text on disk — accessible on rooted/jailbroken devices. Authentication tokens, passwords, and API keys must use expo-secure-store (iOS Keychain / Android Keystore) which uses hardware-backed encryption.',
    },
    {
      title: 'Placing text directly in View (runtime crash in production)',
      wrong: `// This crashes in production builds (works only in dev by accident)
<View>
  Hello World
  {name}
</View>`,
      right: `// All text must be wrapped in <Text>
<View>
  <Text>Hello World</Text>
  <Text>{name}</Text>
</View>`,
      explanation: 'React Native\'s native renderer does not support text nodes as direct children of View. It crashes with "Text strings must be rendered within a <Text> component." Dev mode may be lenient but production builds will crash.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Todo App',
    language: 'typescript',
    description: `Build a React Native todo app with:

1. A FlatList showing todo items with a checkbox (Pressable) to toggle completion
2. A TextInput + "Add" button to add new todos
3. StyleSheet.create() for all styles (no inline objects)
4. Completed todos shown with a strikethrough text style and reduced opacity
5. AsyncStorage persistence — save and load todos on mount
6. A count of remaining incomplete todos in the header`,
    hints: [
      'State: const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([])',
      'Load from AsyncStorage in useEffect([]) and save in a separate useEffect([todos])',
      'Toggle: setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))',
      'Strikethrough: textDecorationLine: "line-through" in StyleSheet',
    ],
    starterCode: `import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Todo { id: string; text: string; done: boolean; }

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  // TODO: Load todos from AsyncStorage on mount
  // TODO: Save todos to AsyncStorage when todos changes

  function addTodo() {
    // TODO: add new todo, clear input
  }

  function toggleTodo(id: string) {
    // TODO: toggle done field for matching todo
  }

  const remaining = todos.filter(t => !t.done).length;

  return (
    <View style={styles.container}>
      {/* TODO: Header showing remaining count */}
      {/* TODO: TextInput + Add button row */}
      {/* TODO: FlatList of todo items with checkbox and text */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  // TODO: add more styles
});`,
    solution: `import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Todo { id: string; text: string; done: boolean; }
const STORAGE_KEY = 'todos-v1';

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setTodos(JSON.parse(raw));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [...prev, { id: Date.now().toString(), text, done: false }]);
    setInput('');
  }

  function toggleTodo(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  const remaining = todos.filter(t => !t.done).length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todos ({remaining} remaining)</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput}
          placeholder="Add a todo…" returnKeyType="done" onSubmitEditing={addTodo} />
        <Pressable style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => toggleTodo(item.id)}>
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No todos yet — add one above!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, padding: 16, backgroundColor: '#fff' },
  header:         { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#111827' },
  inputRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input:          { flex: 1, height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12 },
  addBtn:         { backgroundColor: '#0ea5e9', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText:     { color: '#fff', fontWeight: '600' },
  row:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  checkbox:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxDone:   { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  checkmark:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  todoText:       { flex: 1, fontSize: 16, color: '#111827' },
  todoTextDone:   { textDecorationLine: 'line-through', color: '#9ca3af', opacity: 0.7 },
  empty:          { textAlign: 'center', padding: 32, color: '#6b7280' },
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the React Native equivalent of a web <div>?',
      options: ['<Container>', '<Box>', '<View>', '<Frame>'],
      answer: 2,
      explanation: '<View> is the fundamental layout container in React Native. It maps to UIView on iOS and android.view.View on Android. It supports flexbox layout and does not render any visible content by itself.',
    },
    {
      q: 'Why must all text be inside a <Text> component in React Native?',
      options: ['For performance — the native renderer processes Text nodes separately', 'React Native\'s native renderer does not support text nodes as direct children of View — placing text directly causes a crash in production', 'For accessibility — text must have a role', 'It is a TypeScript requirement only'],
      answer: 1,
      explanation: 'React Native renders native UI components, not HTML. The native bridge cannot handle raw text nodes as children of View — it crashes with "Text strings must be rendered within a <Text> component." This applies to both literal strings and JS expressions.',
    },
    {
      q: 'What does StyleSheet.create() provide over inline style objects?',
      options: ['CSS cascade support', 'Dev-time validation of style properties and a stable integer ID per style (avoiding new object references on every render)', 'Server-side rendering', 'Automatic dark mode support'],
      answer: 1,
      explanation: 'StyleSheet.create() validates style property names and values at development time, and assigns a stable integer ID to each style object. React Native\'s layout engine can skip re-layout when the ID has not changed — inline objects are new references every render.',
    },
    {
      q: 'Why should you use FlatList instead of ScrollView for long lists?',
      options: ['FlatList supports horizontal scrolling; ScrollView does not', 'FlatList is virtualised — it only renders visible items. ScrollView renders all children at once, causing crashes and lag on large lists', 'ScrollView is deprecated', 'FlatList has built-in pull-to-refresh'],
      answer: 1,
      explanation: 'ScrollView mounts every child immediately — rendering 1000 items creates 1000 native views. FlatList (built on VirtualizedList) only renders items visible in the viewport, maintaining constant memory and render time regardless of list length.',
    },
    {
      q: 'What is the default flexDirection in React Native?',
      options: ['row (same as CSS)', 'column (opposite of CSS default)', 'row-reverse', 'depends on the Platform.OS'],
      answer: 1,
      explanation: 'React Native defaults to flexDirection: "column" — items stack vertically by default. CSS defaults to row. This is a common gotcha when migrating from web to RN layout.',
    },
    {
      q: 'Where should you store authentication tokens in React Native?',
      options: ['AsyncStorage — it is encrypted', 'expo-secure-store (iOS Keychain / Android Keystore) — hardware-backed encryption', 'useState — fast and in-memory', 'MMKV — fastest key-value storage'],
      answer: 1,
      explanation: 'AsyncStorage is plain text on disk — accessible on rooted/jailbroken devices. expo-secure-store uses iOS Keychain and Android Keystore which are hardware-backed secure enclaves. Always store tokens, passwords, and sensitive keys in SecureStore.',
    },
    {
      q: 'What is the New Architecture in React Native?',
      options: ['A new file-based routing system', 'Fabric renderer (C++ JSI-based) + JSI bridge enabling synchronous JS↔native calls, replacing the async JSON bridge', 'A new state management solution', 'The Expo managed workflow'],
      answer: 1,
      explanation: 'The New Architecture consists of: Fabric (new C++ renderer), JSI (JavaScript Interface — synchronous C++ calls from JS), and TurboModules (lazy-loaded native modules). It eliminates the async JSON serialisation bridge of the old architecture, enabling synchronous native calls and better performance.',
    },
    {
      q: 'What does Platform.select() do?',
      options: ['Selects a UI theme based on the platform', 'Returns a value from an object keyed by platform ("ios"/"android"/"web") — useful for platform-specific styles and values', 'Checks if a platform API is available', 'Imports platform-specific modules'],
      answer: 1,
      explanation: 'Platform.select({ ios: 44, android: 56, default: 50 }) returns the value for the current platform. It is the inline alternative to platform-specific files (.ios.tsx / .android.tsx) for simple per-platform value differences.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use Expo or bare React Native?',
      a: 'Start with Expo — it eliminates native toolchain setup, provides a rich SDK, and EAS Build handles production binaries in the cloud. Eject to a bare workflow only when you need a native module that Expo does not support. Most apps ship with Expo managed workflow from prototype to production.',
    },
    {
      q: 'What is the difference between React Navigation and Expo Router?',
      a: 'React Navigation is a library you configure in code — you define screens and navigators in JS. Expo Router adds file-based routing on top of React Navigation — file paths map to routes automatically (like Next.js). Expo Router is the recommended approach for new Expo apps; React Navigation is still valid for bare RN projects.',
    },
    {
      q: 'Can I share code between React and React Native?',
      a: 'Yes — business logic, custom hooks, context, state management, and type definitions are fully shareable. Only UI components differ (View vs div, Text vs p). Monorepo with shared packages (Turborepo or Nx), platform-specific extensions (.web.tsx / .native.tsx), and libraries like Tamagui or NativeWind help share UI too.',
    },
    {
      q: 'How do I debug React Native apps?',
      a: 'React Native DevTools (included with Expo) gives component inspector, network inspector, and a JS debugger. For performance, use the Profiler in DevTools. Flipper is an alternative for bare RN. For production crashes, Sentry and Bugsnag support RN with source maps for symbolicated stack traces.',
    },
    {
      q: 'When should I use Reanimated vs the built-in Animated API?',
      a: 'Always prefer Reanimated 3 for new code. The built-in Animated API runs on the JS thread — animations stutter when the JS thread is busy. Reanimated runs animations via worklets on the UI thread, staying smooth even during heavy JS work. The API is also cleaner with useSharedValue and useAnimatedStyle.',
    },
    {
      q: 'How do I handle deep linking in React Native?',
      a: 'Configure a linking object in NavigationContainer: define scheme ("myapp://") and pathMappings for each screen. On iOS, add the URL scheme to Info.plist; on Android, add an intent filter to AndroidManifest.xml. Expo Router handles deep links automatically based on file-system routes. Test with the CLI: npx uri-scheme open myapp://profile/123 --ios.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'No HTML, no CSS — View/Text/FlatList with StyleSheet.create, React Navigation for routing, Expo for tooling.',
    mustKnow: [
      'All text in <Text>; all layout in <View> with flexbox (default flexDirection: "column")',
      'StyleSheet.create() over inline objects — stable IDs, dev-time validation, no new references per render',
      'FlatList for any list over ~50 items — virtualised. ScrollView renders all children at once.',
      'SecureStore for tokens/passwords; AsyncStorage for non-sensitive preferences',
      'React Navigation: NavigationContainer → Tab.Navigator → Stack.Navigator → screens',
      'Reanimated 3 for animations (UI thread worklets); Platform.select() for platform-specific values',
    ],
    interviewFocus: [
      'What is the difference between View and div — why can\'t you use HTML in React Native?',
      'Why FlatList over ScrollView for long lists — what does virtualisation do?',
      'What is the New Architecture (Fabric + JSI) and what problem does it solve?',
      'Where do you store sensitive data in React Native and why not AsyncStorage?',
    ],
  };
}
