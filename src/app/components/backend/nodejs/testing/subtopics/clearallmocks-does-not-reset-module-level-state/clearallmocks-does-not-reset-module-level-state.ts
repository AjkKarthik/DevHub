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
  templateUrl: './clearallmocks-does-not-reset-module-level-state.html',
  styleUrl: './clearallmocks-does-not-reset-module-level-state.scss'
})
export class ClearallmocksDoesNotResetModuleLevelStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'clearAllMocks() and resetAllMocks() only touch Jest\'s own mock bookkeeping — never a module\'s own state',
      points: [
        'The main page\'s own "Not clearing mocks between tests" mistake shows jest.clearAllMocks() fixing a call-count leak between tests, and its revision summary recommends putting it in afterEach as a blanket rule. That fix genuinely works for mock call counts — but it is easy to over-generalize into believing clearAllMocks() (or resetAllMocks()) resets ALL state that could leak between tests. It does not.',
        'Per Jest\'s own documentation: clearAllMocks() "clears the mock.calls, mock.instances, mock.contexts and mock.results properties of all mocks" — equivalent to calling .mockClear() on every mock. resetAllMocks() goes further, resetting mock state including removing custom implementations back to a no-op — equivalent to .mockReset() on every mock. Both are confined strictly to Jest\'s own mock-function metadata.',
        'Neither function touches a module\'s own top-level state that isn\'t itself a Jest mock — for example, a module-scoped let counter = 0 that some exported function increments. That variable lives in the module\'s own closure, entirely outside Jest\'s mock-tracking system, so clearAllMocks()/resetAllMocks() have no effect on it whatsoever. Only jest.resetModules() — which Jest\'s docs describe as resetting "the module registry - the cache of all required modules" — forces a fresh module instance (and therefore fresh module-scoped variables) on the next require/import.',
      ]
    },
    {
      heading: 'Why this distinction matters for test isolation',
      points: [
        'A module implementing something stateful at the top level — a request counter, an in-memory cache Map, a rate-limiter\'s internal bucket — keeps that state for as long as the module stays in Jest\'s require cache, which by default is the entire test file\'s run. Putting jest.clearAllMocks() in afterEach (the main page\'s own recommended fix for mock pollution) does nothing to reset that counter/Map/bucket between tests in the same file.',
        'The actual fix for module-level state leaking between tests is either: designing the module to expose an explicit reset function that tests call directly (the same "expose a reset helper" pattern the main page\'s own challenge solution already uses for its in-memory tasks array via resetTasks()), or calling jest.resetModules() combined with re-importing the module fresh in beforeEach — the latter is heavier and slower, since every dependency of that module also gets re-instantiated.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'clearAllMocks() resets mock call counts — but not the module\'s own counter',
      language: 'typescript',
      code: `// rate-limiter.js
let requestCount = 0; // module-level state, NOT a Jest mock
export function recordRequest() { requestCount += 1; return requestCount; }
export function getCount() { return requestCount; }

// rate-limiter.test.js
import { recordRequest, getCount } from './rate-limiter';
import { sendAlert } from './alerts';

jest.mock('./alerts');

afterEach(() => {
  jest.clearAllMocks(); // resets sendAlert's call history — NOT requestCount
});

test('records a request', () => {
  recordRequest();
  expect(getCount()).toBe(1); // passes
});

test('records a request in a fresh state', () => {
  recordRequest();
  // FAILS — expected 1, received 2. clearAllMocks() never touched
  // requestCount, because it isn't a Jest mock at all — it's just
  // module-scoped JS state that survives across tests in this file.
  expect(getCount()).toBe(1);
});`,
    },
    {
      label: 'The actual fix: an explicit reset function, or resetModules()',
      language: 'typescript',
      code: `// Option 1 — expose an explicit reset export (cheap, explicit, preferred)
// rate-limiter.js
let requestCount = 0;
export function recordRequest() { requestCount += 1; return requestCount; }
export function getCount() { return requestCount; }
export function __resetForTests() { requestCount = 0; }

// rate-limiter.test.js
import { recordRequest, getCount, __resetForTests } from './rate-limiter';

afterEach(() => {
  __resetForTests(); // explicitly resets the module's own state
});

// Option 2 — jest.resetModules() + re-require in beforeEach (heavier)
beforeEach(() => {
  jest.resetModules(); // clears Jest's module registry entirely
  ({ recordRequest, getCount } = require('./rate-limiter')); // fresh instance
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite for an in-memory session store module (with a module-level Map tracking active sessions) has jest.clearAllMocks() in its afterEach hook. Two tests that each create a session and assert the store\'s size both fail when run together — the second test sees a store with 2 sessions instead of the expected 1. The team assumes clearAllMocks() must be broken, since "clearing mocks between tests" is supposed to prevent exactly this kind of leak. Explain what is actually happening.',
    hint: 'Is the session-tracking Map itself a Jest mock (something created via jest.fn(), jest.mock(), or jest.spyOn()), or is it just a plain module-level JavaScript variable that some exported function mutates?',
    solution: 'clearAllMocks() is not broken — it is working exactly as documented, which is precisely the problem: it only resets Jest\'s own mock-function bookkeeping (call counts, instances, results on things created via jest.fn()/jest.mock()/jest.spyOn()), and the session-tracking Map described here is not a Jest mock at all — it is a plain module-level JavaScript variable that the module\'s own exported functions mutate directly. Since that Map lives in the module\'s own closure, entirely outside Jest\'s mock-tracking system, clearAllMocks() (and even resetAllMocks()) has no effect on it whatsoever — the module stays cached in Jest\'s module registry for the whole test file\'s run, so the Map accumulates sessions across every test that shares the file. The team\'s assumption conflates two genuinely different things: "clearing mock call history" (what clearAllMocks() actually does) and "resetting a module\'s own internal state" (what it was never designed to do). The real fix is either exposing an explicit reset function from the session-store module that the test suite calls in afterEach/beforeEach, or using jest.resetModules() to force a completely fresh module instance (with a fresh, empty Map) before each test.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'jest.clearAllMocks() (or resetAllMocks()) in afterEach is a general-purpose "reset everything between tests" tool that prevents any kind of state from leaking between tests in the same file — mock call counts, module variables, caches, all of it.',
      reality: 'This subtopic\'s theory and first code example both show this is a real over-generalization — clearAllMocks()/resetAllMocks() are confined strictly to Jest\'s own mock-function metadata; a module\'s own top-level state (a counter, a Map, any plain variable that isn\'t itself a Jest mock) is completely untouched by either function.'
    },
    {
      thought: 'Since the main page\'s own "Not clearing mocks between tests" mistake was fixed by adding jest.clearAllMocks() to afterEach, that same fix generalizes to any test-pollution symptom that looks similar, including module-level state leaking between tests.',
      reality: 'This subtopic\'s exercise shows the opposite — the same-looking symptom (state accumulating across tests in a file) can have a completely different root cause (module-level state, not mock call history) requiring a completely different fix (an explicit reset export, or jest.resetModules()), not clearAllMocks().'
    },
    {
      thought: 'A module stays fresh for every test automatically, the same way each test function gets its own local variables — so a module-level variable mutated in one test naturally starts over in the next test without needing any special handling.',
      reality: 'This subtopic\'s first code example shows the opposite — a module is only loaded (and its top-level state initialized) once per test FILE by default, thanks to Jest\'s module registry/require cache, meaning module-level state genuinely persists and accumulates across every test in that file unless jest.resetModules() (or an explicit reset function) is used.'
    }
  ];
}
