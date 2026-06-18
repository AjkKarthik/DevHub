import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CheatSection {
  id: string;
  label: string;
  items: CheatItem[];
}

interface CheatItem {
  name: string;
  signature: string;
  description: string;
  example: string;
  tags: string[];
}

@Component({
  selector: 'app-js-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class JsCheatsheet {
  searchQuery = signal('');
  activeTab = signal('arrays');

  tabs: CheatSection[] = [
    {
      id: 'arrays',
      label: 'Arrays',
      items: [
        { name: 'map', signature: 'arr.map(fn)', description: 'Transform each element, return new array', example: '[1,2,3].map(x => x*2) // [2,4,6]', tags: ['array','transform','functional'] },
        { name: 'filter', signature: 'arr.filter(fn)', description: 'Keep elements where fn returns truthy', example: '[1,2,3,4].filter(x => x%2===0) // [2,4]', tags: ['array','filter'] },
        { name: 'reduce', signature: 'arr.reduce(fn, init)', description: 'Accumulate array to single value', example: '[1,2,3].reduce((sum,x) => sum+x, 0) // 6', tags: ['array','reduce','functional'] },
        { name: 'find', signature: 'arr.find(fn)', description: 'First element matching predicate, or undefined', example: '[1,2,3].find(x => x>1) // 2', tags: ['array','search'] },
        { name: 'findIndex', signature: 'arr.findIndex(fn)', description: 'Index of first match, or -1', example: '[1,2,3].findIndex(x => x>1) // 1', tags: ['array','search'] },
        { name: 'some', signature: 'arr.some(fn)', description: 'True if at least one element matches', example: '[1,2,3].some(x => x>2) // true', tags: ['array','test'] },
        { name: 'every', signature: 'arr.every(fn)', description: 'True if all elements match', example: '[2,4,6].every(x => x%2===0) // true', tags: ['array','test'] },
        { name: 'flat', signature: 'arr.flat(depth)', description: 'Flatten nested arrays (default depth 1)', example: '[[1],[2,[3]]].flat() // [1,2,[3]]', tags: ['array','flat'] },
        { name: 'flatMap', signature: 'arr.flatMap(fn)', description: 'map then flat(1) — common for one-to-many', example: '[1,2].flatMap(x => [x,-x]) // [1,-1,2,-2]', tags: ['array','flat','transform'] },
        { name: 'includes', signature: 'arr.includes(val)', description: 'True if value is in array (uses SameValueZero)', example: '[1,2,3].includes(2) // true', tags: ['array','search'] },
        { name: 'indexOf', signature: 'arr.indexOf(val)', description: 'First index of value, or -1', example: '[1,2,3].indexOf(2) // 1', tags: ['array','search'] },
        { name: 'slice', signature: 'arr.slice(start, end)', description: 'Extract subarray (non-mutating)', example: '[1,2,3,4].slice(1,3) // [2,3]', tags: ['array','extract'] },
        { name: 'splice', signature: 'arr.splice(start, del, ...items)', description: 'Remove/insert elements in-place (mutating)', example: 'let a=[1,2,3]; a.splice(1,1,"x"); // a=[1,"x",3]', tags: ['array','mutate'] },
        { name: 'sort', signature: 'arr.sort(fn?)', description: 'Sort in-place; provide comparator for numbers', example: '[3,1,2].sort((a,b)=>a-b) // [1,2,3]', tags: ['array','sort','mutate'] },
        { name: 'Array.from', signature: 'Array.from(iterable, mapFn?)', description: 'Create array from iterable or array-like', example: 'Array.from({length:3},(_,i)=>i) // [0,1,2]', tags: ['array','create'] },
        { name: 'Array.isArray', signature: 'Array.isArray(val)', description: 'True if val is an Array', example: 'Array.isArray([1,2]) // true', tags: ['array','type'] },
      ],
    },
    {
      id: 'objects',
      label: 'Objects',
      items: [
        { name: 'Object.keys', signature: 'Object.keys(obj)', description: 'Array of own enumerable string keys', example: 'Object.keys({a:1,b:2}) // ["a","b"]', tags: ['object','keys'] },
        { name: 'Object.values', signature: 'Object.values(obj)', description: 'Array of own enumerable values', example: 'Object.values({a:1,b:2}) // [1,2]', tags: ['object','values'] },
        { name: 'Object.entries', signature: 'Object.entries(obj)', description: 'Array of [key,value] pairs', example: 'Object.entries({a:1}) // [["a",1]]', tags: ['object','entries'] },
        { name: 'Object.fromEntries', signature: 'Object.fromEntries(iterable)', description: 'Create object from [key,value] pairs', example: 'Object.fromEntries([["a",1]]) // {a:1}', tags: ['object','create'] },
        { name: 'Object.assign', signature: 'Object.assign(target, ...src)', description: 'Shallow copy own enumerable props to target', example: 'Object.assign({},{a:1},{b:2}) // {a:1,b:2}', tags: ['object','copy'] },
        { name: 'Object.freeze', signature: 'Object.freeze(obj)', description: 'Prevent property changes (shallow)', example: 'const o=Object.freeze({x:1}); o.x=2; // silently fails', tags: ['object','immutable'] },
        { name: 'Spread {...obj}', signature: '{ ...obj, key: val }', description: 'Shallow clone and override properties', example: 'const b={...a, age:30} // new object', tags: ['object','spread','copy'] },
        { name: 'Optional chaining', signature: 'obj?.prop?.sub', description: 'Short-circuit to undefined if null/undefined', example: 'user?.address?.city // safe deep access', tags: ['object','optional'] },
        { name: 'Nullish coalescing', signature: 'val ?? default', description: 'Use default only if val is null/undefined', example: '(null ?? "default") // "default"', tags: ['object','nullish'] },
        { name: 'Logical assignment', signature: 'a ??= b; a ||= b; a &&= b', description: 'Assign only if condition met', example: 'config.timeout ??= 5000', tags: ['object','assign'] },
      ],
    },
    {
      id: 'promises',
      label: 'Async',
      items: [
        { name: 'Promise.resolve', signature: 'Promise.resolve(val)', description: 'Fulfilled promise wrapping val', example: 'await Promise.resolve(42) // 42', tags: ['async','promise'] },
        { name: 'Promise.reject', signature: 'Promise.reject(err)', description: 'Rejected promise with err', example: 'Promise.reject(new Error("fail"))', tags: ['async','promise'] },
        { name: 'Promise.all', signature: 'Promise.all([...promises])', description: 'Resolves when ALL resolve; rejects on first rejection', example: 'const [a,b] = await Promise.all([p1,p2])', tags: ['async','promise','parallel'] },
        { name: 'Promise.allSettled', signature: 'Promise.allSettled([...promises])', description: 'Waits for ALL; returns {status,value/reason}[]', example: 'const results = await Promise.allSettled([p1,p2])', tags: ['async','promise','parallel'] },
        { name: 'Promise.race', signature: 'Promise.race([...promises])', description: 'Resolves/rejects with first to settle', example: 'await Promise.race([fetch(url), timeout])', tags: ['async','promise'] },
        { name: 'Promise.any', signature: 'Promise.any([...promises])', description: 'Resolves with first fulfillment; rejects if ALL reject', example: 'await Promise.any([mirror1, mirror2])', tags: ['async','promise'] },
        { name: 'async/await', signature: 'async fn() { await expr }', description: 'Syntactic sugar over Promises', example: 'const data = await fetch(url).then(r=>r.json())', tags: ['async','await'] },
        { name: 'try/catch async', signature: 'try { await p } catch(e) {}', description: 'Handle async errors with familiar syntax', example: 'try { await fetchData() } catch(e) { handle(e) }', tags: ['async','error'] },
        { name: 'AbortController', signature: 'new AbortController()', description: 'Cancel fetch and async operations', example: 'const {signal}=new AbortController(); fetch(u,{signal})', tags: ['async','cancel','fetch'] },
      ],
    },
    {
      id: 'strings',
      label: 'Strings',
      items: [
        { name: 'Template literal', signature: '`text ${expr}`', description: 'Embed expressions in strings', example: '`Hello ${name}!` // "Hello Alice!"', tags: ['string','template'] },
        { name: 'includes', signature: 'str.includes(sub)', description: 'True if substring present', example: '"hello".includes("ell") // true', tags: ['string','search'] },
        { name: 'startsWith/endsWith', signature: 'str.startsWith(s) / .endsWith(s)', description: 'True if str starts/ends with given string', example: '"hello".startsWith("he") // true', tags: ['string','search'] },
        { name: 'slice', signature: 'str.slice(start, end?)', description: 'Extract substring (non-mutating)', example: '"hello".slice(1,3) // "el"', tags: ['string','extract'] },
        { name: 'split', signature: 'str.split(sep)', description: 'Split to array of strings', example: '"a,b,c".split(",") // ["a","b","c"]', tags: ['string','split'] },
        { name: 'trim', signature: 'str.trim() / trimStart / trimEnd', description: 'Remove whitespace from ends', example: '"  hi  ".trim() // "hi"', tags: ['string','whitespace'] },
        { name: 'padStart/padEnd', signature: 'str.padStart(len, fill?)', description: 'Pad string to target length', example: '"5".padStart(3,"0") // "005"', tags: ['string','pad'] },
        { name: 'replace/replaceAll', signature: 'str.replace(pat, rep)', description: 'Replace first / all occurrences', example: '"aabbcc".replaceAll("b","x") // "aaxxcc"', tags: ['string','replace'] },
        { name: 'matchAll', signature: 'str.matchAll(regex)', description: 'Iterator of all regex matches with groups', example: '[...str.matchAll(/\\\\d+/g)].map(m=>m[0])', tags: ['string','regex'] },
        { name: 'at', signature: 'str.at(index)', description: 'Element at index; negative indexes from end', example: '"hello".at(-1) // "o"', tags: ['string','index'] },
      ],
    },
    {
      id: 'destructuring',
      label: 'Syntax',
      items: [
        { name: 'Object destructure', signature: 'const { a, b } = obj', description: 'Extract named properties', example: 'const {name,age}=user; // name="Alice"', tags: ['destructure','syntax'] },
        { name: 'Array destructure', signature: 'const [a, b] = arr', description: 'Extract positional elements', example: 'const [x,y]=[1,2]; // x=1, y=2', tags: ['destructure','syntax'] },
        { name: 'Default value', signature: 'const { a = default } = obj', description: 'Use default when property is undefined', example: 'const {port=3000}=config', tags: ['destructure','default'] },
        { name: 'Rename on destructure', signature: 'const { a: renamed } = obj', description: 'Alias property to different variable name', example: 'const {name:userName}=user', tags: ['destructure','rename'] },
        { name: 'Rest in destructure', signature: 'const { a, ...rest } = obj', description: 'Collect remaining properties', example: 'const {id,...data}=record', tags: ['destructure','rest'] },
        { name: 'Spread operator', signature: '[...arr] / {...obj}', description: 'Expand iterable into a new context', example: 'const merged={...a,...b}', tags: ['spread','syntax'] },
        { name: 'Optional chaining ?.', signature: 'obj?.prop / arr?.[i] / fn?.()', description: 'Short-circuit on null/undefined', example: 'user?.profile?.avatar?.url', tags: ['optional','syntax'] },
        { name: 'Nullish ??', signature: 'a ?? b', description: 'b only if a is null or undefined (not 0 or "")', example: 'const n = value ?? 0', tags: ['nullish','syntax'] },
        { name: 'Logical OR assign', signature: 'a ||= b', description: 'Assign b if a is falsy', example: 'opts.timeout ||= 5000', tags: ['assign','syntax'] },
        { name: 'for...of', signature: 'for (const x of iterable)', description: 'Iterate values of any iterable', example: 'for (const [k,v] of map) { }', tags: ['loop','iterable'] },
      ],
    },
    {
      id: 'types',
      label: 'Types & Coercion',
      items: [
        { name: 'typeof', signature: 'typeof val', description: 'Returns type string; "object" for null (bug)', example: 'typeof 42 // "number"; typeof null // "object"', tags: ['type','check'] },
        { name: 'instanceof', signature: 'val instanceof Constructor', description: 'True if val is in prototype chain of Constructor', example: '[] instanceof Array // true', tags: ['type','check'] },
        { name: 'Number()', signature: 'Number(val)', description: 'Convert to number; NaN on failure', example: 'Number("3.14") // 3.14; Number("x") // NaN', tags: ['type','coerce'] },
        { name: 'parseInt / parseFloat', signature: 'parseInt(str, radix)', description: 'Parse integer/float from string start', example: 'parseInt("42px") // 42', tags: ['type','parse'] },
        { name: 'String()', signature: 'String(val)', description: 'Reliable conversion to string', example: 'String(null) // "null"; String(42) // "42"', tags: ['type','coerce'] },
        { name: 'Boolean()', signature: 'Boolean(val)', description: 'Convert to boolean; falsy values → false', example: 'Boolean(0) // false; Boolean("x") // true', tags: ['type','coerce'] },
        { name: 'Falsy values', signature: '0, "", null, undefined, NaN, false', description: 'These 6 are falsy; everything else is truthy', example: 'if (!0) // enters block', tags: ['type','falsy'] },
        { name: 'Strict equality ===', signature: 'a === b', description: 'No type coercion; always prefer over ==', example: '"1" === 1 // false (safe)', tags: ['equality','type'] },
        { name: 'Object.is', signature: 'Object.is(a, b)', description: 'Like === but handles NaN===NaN and -0 vs +0', example: 'Object.is(NaN,NaN) // true', tags: ['equality','type'] },
        { name: 'structuredClone', signature: 'structuredClone(val)', description: 'Deep clone any serializable value', example: 'const copy = structuredClone({a:{b:1}})', tags: ['object','clone'] },
      ],
    },
  ];

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const section = this.tabs.find(t => t.id === this.activeTab());
    if (!section) return [];
    if (!q) return section.items;
    return section.items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.signature.toLowerCase().includes(q) ||
      item.tags.some(t => t.includes(q))
    );
  });

  setTab(id: string) { this.activeTab.set(id); }
}
