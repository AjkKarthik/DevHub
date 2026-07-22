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
  templateUrl: './newclient-lazy-connects-on-first-rpc.html',
  styleUrl: './newclient-lazy-connects-on-first-rpc.scss'
})
export class NewclientLazyConnectsOnFirstRpcSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names grpc.NewClient as the recommended choice — but not what "no eager connection" actually means',
      points: [
        'The main page\'s own theory mentions grpc.Dial vs grpc.NewClient only briefly, noting NewClient is the "v1.65+ recommended" choice, without spelling out the specific behavioral difference that makes it recommended. This subtopic covers exactly that gap: what NewClient actually does — and does not do — at the moment it is called.',
        'grpc-go\'s own documentation states this directly: "No I/O is performed. Use of the ClientConn for RPCs will automatically cause it to connect." Calling grpc.NewClient(target, opts...) does not open a TCP connection, does not perform a DNS lookup, and does not attempt a TLS handshake — none of that I/O happens at NewClient call time at all. The actual connection is established lazily, automatically, the first time the returned ClientConn is actually used to make an RPC.',
        'This is a deliberate behavioral difference from the OLDER grpc.Dial\'s own historical default (which, without WithBlock, still returned quickly but had different edge-case behaviors around connection state and error surfacing that NewClient\'s docs explicitly supersede) — NewClient standardizes on lazy-connect as the ONLY behavior, with no blocking-dial option built in the way Dial historically offered via WithBlock.',
      ]
    },
    {
      heading: 'The direct consequence: connection errors surface on the first RPC, not at client creation',
      points: [
        'Because no I/O happens inside NewClient itself, a NewClient call essentially cannot fail due to the target being unreachable — an unreachable host, a refused connection, or a DNS resolution failure are all NETWORK problems that only manifest once actual network activity is attempted, and NewClient performs none. NewClient can still return an error, but only for LOCAL, purely-syntactic problems — a malformed target string or invalid DialOptions — never for "is the server actually there" questions.',
        'This means the error-handling shape of gRPC client code genuinely changes depending on which function created the connection: code assuming (perhaps from experience with Dial + WithBlock, or from other RPC/database client libraries that DO connect eagerly) that a successful client-creation call means "we have a live, verified connection" is checking the wrong place — with NewClient, that verification only happens implicitly on the FIRST actual RPC call, and the error to check is the one returned by THAT call, not by NewClient itself.',
        'For code that genuinely needs to verify connectivity up front — a startup health check, or a CLI tool that should fail fast with a clear "cannot reach server" message before doing anything else — the documented, explicit mechanism is cc.Connect() (triggers a connection attempt without blocking) paired with cc.WaitForStateChange(ctx, connectivity.Idle) or checking cc.GetState(), rather than relying on NewClient\'s own return value to signal reachability, since it structurally cannot.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'NewClient succeeds even against an unreachable target',
      language: 'typescript',
      code: `package main

import (
    "fmt"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
)

func main() {
    // "localhost:1" is essentially guaranteed to be unreachable --
    // nothing is listening on port 1. Per this subtopic's theory,
    // NewClient performs NO I/O, so this succeeds regardless.
    conn, err := grpc.NewClient("localhost:1",
        grpc.WithTransportCredentials(insecure.NewCredentials()))

    if err != nil {
        fmt.Println("NewClient failed:", err)
    } else {
        fmt.Println("NewClient succeeded -- but no connection attempt")
        fmt.Println("has actually happened yet at this point.")
    }
    defer conn.Close()

    // The connection attempt -- and any resulting failure -- only
    // happens once an RPC is actually made through this conn, e.g.
    // client := pb.NewUserServiceClient(conn)
    // _, err := client.GetUser(ctx, req) // THIS is where a
    //                                       "connection refused"
    //                                       style error would
    //                                       actually surface.
}`,
    },
    {
      label: 'Explicitly checking connectivity up front with Connect()',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/connectivity"
    "google.golang.org/grpc/credentials/insecure"
)

// verifyReachable demonstrates the documented, explicit mechanism
// for confirming connectivity BEFORE making a real RPC -- useful for
// a startup health check or a CLI tool that wants to fail fast with
// a clear error, rather than discovering unreachability only when
// the first real business-logic RPC call happens to be made.
func verifyReachable(target string, timeout time.Duration) error {
    conn, err := grpc.NewClient(target,
        grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        return fmt.Errorf("invalid client config: %w", err)
    }
    defer conn.Close()

    conn.Connect() // explicitly trigger a connection attempt --
                     // does not block on its own

    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    for {
        state := conn.GetState()
        if state == connectivity.Ready {
            return nil // confirmed reachable
        }
        if !conn.WaitForStateChange(ctx, state) {
            return fmt.Errorf("timed out waiting to reach %s (last state: %s)", target, state)
        }
    }
}

func main() {
    if err := verifyReachable("localhost:50051", 3*time.Second); err != nil {
        fmt.Println("startup check failed:", err)
        return
    }
    fmt.Println("server is reachable -- proceeding")
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service\'s main() function calls grpc.NewClient once at startup to create a shared connection to a downstream dependency, checks the returned error, logs "connected to downstream service" if err is nil, and proceeds to start accepting its own incoming requests. In production, the downstream service happens to be temporarily unreachable when this service starts up — yet the log line "connected to downstream service" still prints, and the service starts accepting requests normally. Using this subtopic\'s theory, explain why this log message is misleading, and what it would take to make it accurate.',
    hint: 'Per this subtopic\'s theory, what kind of problems can actually cause grpc.NewClient itself to return a non-nil error — and is "the downstream service happens to be unreachable" one of them? When does that specific kind of failure actually get detected instead?',
    solution: 'The log message is misleading because grpc.NewClient succeeding (returning a nil error) says nothing at all about whether the downstream service is actually reachable — per this subtopic\'s theory, "no I/O is performed" inside NewClient itself, so it can only fail for local, syntactic problems like a malformed target string, never for network-level unreachability. The downstream service being temporarily unreachable at startup is exactly the kind of problem NewClient structurally cannot detect, since it never attempts any actual network I/O to discover it — that detection would only happen later, on the first genuine RPC call made through this connection, whenever that first call actually occurs. The current code\'s "connected to downstream service" log line is therefore not describing a verified fact — it is only describing "the connection OBJECT was successfully constructed," which per this subtopic\'s theory is a much weaker and different claim than "the downstream service was confirmed reachable." To make the log message accurate, the service needs the explicit verification pattern from this subtopic\'s second code example: call conn.Connect() to trigger an actual connection attempt, then use conn.GetState()/conn.WaitForStateChange() (or a Health Check RPC, if the downstream service supports one) to genuinely wait for and confirm a Ready connectivity state before logging success — only then does "connected to downstream service" correspond to something this subtopic\'s theory would call true.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own theory calls grpc.NewClient the "recommended" choice over grpc.Dial, and a successful NewClient call returns a working *grpc.ClientConn with no error, a nil error from NewClient is a reasonable signal that the target server is currently reachable — similar to what a successful database connection call typically confirms.',
      reality: 'This subtopic\'s theory and first code example show NewClient\'s nil error means something fundamentally different and weaker: "no I/O is performed" at NewClient time, so a nil error only confirms the LOCAL configuration (target string, DialOptions) was valid — it says nothing about server reachability, unlike a database client\'s eager-connect model, which this subtopic\'s exercise shows is an easy but incorrect analogy to carry over.'
    },
    {
      thought: 'A gRPC connection error caused by an unreachable server will eventually surface as an error from grpc.NewClient itself, just possibly with some delay while the client retries internally before NewClient actually returns.',
      reality: 'This subtopic\'s theory shows NewClient does not delay-then-fail — it returns essentially immediately, having performed no I/O at all, and errors related to unreachability NEVER surface through NewClient\'s own return value under any timing. Such errors only ever surface through the FIRST actual RPC call made using the resulting connection, a structurally different code path than NewClient\'s own return value.'
    },
    {
      thought: 'Explicitly calling cc.Connect() and waiting for a Ready state, as shown in this subtopic\'s second code example, is an unusual, low-level workaround needed only in rare edge cases — ordinary gRPC client code should never need to think about connection state directly, since NewClient plus a normal RPC call handles everything.',
      reality: 'This subtopic\'s exercise shows this explicit verification pattern is the correct, documented tool for a genuinely common, practical need: confirming reachability at startup (health checks, fail-fast CLI tools) BEFORE the first real business-logic RPC happens to run — a need that arises naturally any time a service wants to report its own dependency status accurately, not just in unusual edge cases.'
    }
  ];
}
