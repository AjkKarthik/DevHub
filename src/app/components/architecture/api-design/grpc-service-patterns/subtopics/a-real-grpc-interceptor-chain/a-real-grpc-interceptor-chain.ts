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
    heading: 'Named in Real Depth, Never Actually Chained on This Page',
    points: [
      'A quiz explanation on the main page describes interceptors precisely: "functions that run before and after each RPC method... common uses: authentication interceptor... logging interceptor... chain interceptors: multiple interceptors are chained (run in order)." No codeTab anywhere on the page shows the chaining mechanism itself.',
      'The core idea is the same "middleware" pattern this hub has already covered for HTTP (Express middleware, ASP.NET Core middleware) — each interceptor receives the call AND a <code>next()</code> function; calling <code>next()</code> passes control to the next interceptor in the chain (or the real handler, if it’s the last one); NOT calling <code>next()</code> stops the chain right there.',
      'This is exactly what makes an auth interceptor able to reject a call before it ever reaches the real handler — it simply returns its own error response instead of calling <code>next()</code>, and every interceptor and handler after it in the chain never runs at all.',
      'Order matters: a logging interceptor placed BEFORE an auth interceptor logs every call attempt, including rejected ones. The same logging interceptor placed AFTER auth would only ever log calls that passed authentication — a real, observable difference in what ends up in the logs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Chaining Interceptors',
    language: 'typescript',
    code: `interface Call {
  method: string;
  metadata: { authorization?: string };
}

interface RpcResult {
  code: 'OK' | 'UNAUTHENTICATED';
  data?: string;
}

type Interceptor = (call: Call, next: () => RpcResult) => RpcResult;
type Handler = (call: Call) => RpcResult;

function chainInterceptors(interceptors: Interceptor[], handler: Handler) {
  return function invoke(call: Call): RpcResult {
    let index = -1;
    function next(i: number): RpcResult {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      if (i === interceptors.length) return handler(call);
      return interceptors[i](call, () => next(i + 1));
    }
    return next(0);
  };
}

const log: string[] = [];

const loggingInterceptor: Interceptor = (call, next) => {
  log.push(\`log: before \${call.method}\`);
  const result = next();
  log.push(\`log: after \${call.method} -> \${result.code}\`);
  return result;
};

const authInterceptor: Interceptor = (call, next) => {
  if (!call.metadata.authorization) {
    log.push(\`auth: REJECTED \${call.method}\`);
    return { code: 'UNAUTHENTICATED' };
  }
  log.push(\`auth: OK \${call.method}\`);
  return next();
};

const handler: Handler = (call) => {
  log.push(\`handler: \${call.method}\`);
  return { code: 'OK', data: \`result-for-\${call.method}\` };
};

// Order: logging FIRST, so it observes both accepted AND rejected calls.
const invoke = chainInterceptors([loggingInterceptor, authInterceptor], handler);

console.log(invoke({ method: 'GetUser', metadata: { authorization: 'Bearer xyz' } }));
// { code: 'OK', data: 'result-for-GetUser' }

console.log(invoke({ method: 'DeleteUser', metadata: {} }));
// { code: 'UNAUTHENTICATED' } -- handler() never runs

console.log(log);
// [
//   'log: before GetUser', 'auth: OK GetUser', 'handler: GetUser', 'log: after GetUser -> OK',
//   'log: before DeleteUser', 'auth: REJECTED DeleteUser', 'log: after DeleteUser -> UNAUTHENTICATED',
// ]
// -- the rejected DeleteUser call still produced BOTH log lines, because
// logging runs OUTSIDE (before) the auth check in the chain.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The codeTab chains <code>[loggingInterceptor, authInterceptor]</code> — logging first, auth second. If the ORDER were reversed to <code>[authInterceptor, loggingInterceptor]</code>, what would change about the <code>log</code> array’s contents for the rejected <code>DeleteUser</code> call specifically?',
  hint: 'Which interceptor gets to run FIRST when the chain is reversed — and does a REJECTED call (one where <code>next()</code> is never called) ever reach an interceptor placed AFTER the one that rejected it?',
  solution: `// With the order reversed to [authInterceptor, loggingInterceptor],
// authInterceptor runs FIRST. For the rejected DeleteUser call:
//
//   authInterceptor sees no authorization header, logs 'auth: REJECTED
//   DeleteUser', and returns its error WITHOUT calling next() -- which
//   means loggingInterceptor (now positioned AFTER auth in the chain)
//   never runs at all for this call.
//
// So the log array for the rejected call would contain ONLY
// 'auth: REJECTED DeleteUser' -- neither 'log: before DeleteUser' nor
// 'log: after DeleteUser' would ever appear, since loggingInterceptor
// is never reached once auth returns without calling next().
//
// This is a genuine, observable difference in what ends up in your
// logs depending purely on interceptor ORDER -- placing logging first
// (as the original codeTab does) guarantees every call attempt gets
// logged, accepted or not; placing it after auth means REJECTED calls
// are invisible to that logger entirely.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'An interceptor that doesn’t call <code>next()</code> causes an error or crash — the chain has to always run every interceptor to completion.',
    reality: 'NOT calling <code>next()</code> is a completely normal, intentional way for an interceptor to short-circuit the chain — exactly what <code>authInterceptor</code> does when rejecting an unauthenticated call. The codeTab’s own <code>chainInterceptors</code> function has no requirement that every interceptor call <code>next()</code>; it simply returns whatever value the interceptor that DID stop the chain returned.',
  },
  {
    thought: 'Interceptor order doesn’t really matter, as long as all the necessary interceptors are present in the chain somewhere.',
    reality: 'The Try It above demonstrates a real, concrete behavioral difference purely from reordering two interceptors — whether a rejected call gets logged at all depends entirely on whether the logging interceptor sits before or after the interceptor that rejects it. Order is a genuine design decision, not an implementation detail that can be chosen arbitrarily.',
  },
  {
    thought: 'A logging interceptor placed before auth can only log that a call STARTED — it has no way to know the eventual outcome of a call it hasn’t seen the result of yet.',
    reality: 'The codeTab’s <code>loggingInterceptor</code> calls <code>next()</code> and then continues executing AFTER it returns — <code>const result = next(); log.push(...result.code); return result;</code> — meaning it runs code both BEFORE and AFTER the rest of the chain (including the real handler) completes. This is exactly how it manages to log both "before" and "after -> OK"/"after -> UNAUTHENTICATED" for the same call.',
  },
];

@Component({
  selector: 'app-api-grpc-interceptors',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-grpc-interceptor-chain.html',
  styleUrl: './a-real-grpc-interceptor-chain.scss',
})
export class ARealGrpcInterceptorChainSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
