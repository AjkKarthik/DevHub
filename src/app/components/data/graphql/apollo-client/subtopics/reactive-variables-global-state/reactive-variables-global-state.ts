import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-client-reactive-vars',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './reactive-variables-global-state.html',
  styleUrl: './reactive-variables-global-state.scss'
})
export class ReactiveVariablesGlobalStateSubtopic {
  topicLabel = 'Apollo Client';
  topicRoute = '/graphql/apollo-client';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names this in one QnA sentence and never shows it in code',
      points: [
        'The main page\'s own QnA says: "Use Apollo reactive variables (makeVar) for global client-side state... Both integrate with useQuery so components re-render when state changes" — but no codeTab on the page ever creates one.',
        '<code>makeVar(initialValue)</code> returns a single function that acts as BOTH getter and setter — call it with no arguments to read the current value, call it with a new value to update it.',
        '<code>useReactiveVar(someVar)</code> is a React hook that reads a reactive variable\'s current value and re-renders the component whenever that value changes — this works even in components that never call <code>useQuery</code> at all.'
      ]
    },
    {
      heading: 'The QnA\'s "integrate with useQuery" claim is true, but only under one specific condition',
      points: [
        'A reactive variable does NOT automatically make a <code>useQuery</code>-driven component re-render just because you called <code>makeVar()</code> — that only happens for components using <code>useReactiveVar</code> directly.',
        'To make <code>useQuery</code> ALSO react to a reactive variable\'s changes, the variable must be read from inside a cache field policy\'s <code>read</code> function, registered via <code>InMemoryCache</code>\'s <code>typePolicies</code> — this is what genuinely ties the reactive variable into Apollo\'s own cache reactivity system.',
        'Without that field-policy wiring, a reactive variable and a <code>useQuery</code>-driven component are two completely independent reactivity systems that happen to coexist in the same app.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A plain reactive variable (useReactiveVar only)',
      language: 'typescript',
      code: `import { makeVar, useReactiveVar } from '@apollo/client';

export const cartItemsVar = makeVar<string[]>([]);

export function addToCart(postId: string) {
  cartItemsVar([...cartItemsVar(), postId]);  // call with a new value to update
}

function CartBadge() {
  const items = useReactiveVar(cartItemsVar);  // re-renders on every change
  return <span>{items.length} items</span>;
}

// A component driven by useQuery, sitting right next to CartBadge, does NOT
// re-render when cartItemsVar changes -- these are two independent systems
// unless the variable is wired into a field policy (see the next tab).`
    },
    {
      label: 'Wiring it into useQuery via a field policy',
      language: 'typescript',
      code: `import { InMemoryCache, makeVar } from '@apollo/client';

export const cartItemsVar = makeVar<string[]>([]);

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          cartItemCount: {
            read() {
              // Reading the reactive variable INSIDE a field's read()
              // function is what makes useQuery-driven components
              // re-render when cartItemsVar changes.
              return cartItemsVar().length;
            },
          },
        },
      },
    },
  }),
});

// Now a plain useQuery for a LOCAL-only field re-renders on every
// cartItemsVar change, with zero network request involved:
const GET_CART_COUNT = gql\`query { cartItemCount @client }\`;

function CartBadge() {
  const { data } = useQuery(GET_CART_COUNT);  // re-renders too, now
  return <span>{data?.cartItemCount} items</span>;
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team declares <code>const themeVar = makeVar(\'light\')</code> and uses <code>useReactiveVar(themeVar)</code> in their <code>&lt;ThemeToggle&gt;</code> component. They then add a SEPARATE <code>&lt;Header&gt;</code> component that calls <code>useQuery(GET_HEADER_DATA)</code> (a normal server query, unrelated to any field policy) and expect it to re-render whenever <code>themeVar</code> changes so it can show the theme name. Will it?',
    hint: 'A reactive variable only feeds into a component\'s re-render cycle through ONE of two paths -- calling <code>useReactiveVar</code> directly, or being read inside a cache field policy\'s <code>read</code> function that a query actually touches. Does <code>GET_HEADER_DATA</code> touch either path?',
    solution: 'No, Header will NOT re-render when themeVar changes. GET_HEADER_DATA is described as a normal server query with no relationship to any field policy that reads themeVar -- it neither calls useReactiveVar directly, nor does its own query touch a field whose read() function references themeVar. Reactive variables and useQuery are two independent reactivity systems that only connect when a query explicitly touches a field policy reading that variable. The fix would be either (a) call useReactiveVar(themeVar) directly inside Header alongside its useQuery call, or (b) add a @client field to GET_HEADER_DATA backed by a field policy that reads themeVar, matching the pattern in this subtopic\'s own second codeTab.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Declaring a reactive variable with <code>makeVar()</code> automatically makes every <code>useQuery</code>-driven component in the app re-render when it changes.',
      reality: 'Only components calling <code>useReactiveVar()</code> directly re-render automatically. A <code>useQuery</code>-driven component only re-renders on a reactive variable change if that query touches a field whose cache field policy <code>read()</code> function reads the variable.'
    },
    {
      thought: 'Reactive variables are a replacement for a full state-management library like Redux or Zustand.',
      reality: 'They are a lighter-weight tool specifically for state that needs to interoperate with Apollo\'s own query/cache system — for pure client-side state with no relationship to GraphQL queries, a dedicated state library is often still the simpler choice.'
    },
    {
      thought: '<code>makeVar()</code> returns an object with separate <code>.get()</code>/<code>.set()</code> methods, similar to a signal in other frameworks.',
      reality: 'It returns a SINGLE function used for both reading and writing — call it with no arguments to read (<code>themeVar()</code>), call it with a new value to write (<code>themeVar(\'dark\')</code>).'
    }
  ];

  prev: SubtopicLink | null = { label: 'The Real Way to Abort an In-Flight Apollo Query', route: '/graphql/apollo-client/aborting-inflight-queries' };
  next: SubtopicLink | null = { label: 'The update Function for Manual Cache Writes', route: '/graphql/apollo-client/manual-cache-updates' };
}
