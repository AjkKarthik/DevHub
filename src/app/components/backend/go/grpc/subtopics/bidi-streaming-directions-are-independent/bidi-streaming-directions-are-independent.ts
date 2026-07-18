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
  templateUrl: './bidi-streaming-directions-are-independent.html',
  styleUrl: './bidi-streaming-directions-are-independent.scss'
})
export class BidiStreamingDirectionsAreIndependentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names bidirectional streaming as one of the four call types — but never actually codes it',
      points: [
        'The main page\'s own theory lists "Bidirectional Streaming" as one of the four gRPC call types in its opening bullet, and its code examples cover Unary, Server Streaming, and Client Streaming in full — but bidirectional streaming itself never gets a code tab, a mistake entry, or a challenge. This subtopic covers exactly the gap: what makes bidi streaming genuinely different to implement, not just to describe.',
        'With client streaming, the client sends a series of messages and the SINGLE response only comes back after the client calls CloseSend — a clear, sequential handoff. With bidi streaming, there is no such handoff: gRPC\'s own documentation states this directly: "The two streams operate independently, so clients and servers can read and write in whatever order they like... the server could wait to receive all the client messages before writing its responses, or it could alternately read a message then write a message, or some other combination of reads and writes."',
        'The one guarantee that DOES hold, per the same documentation: "The order of messages in each stream is preserved" — messages within ONE direction arrive in the order they were sent, but the two directions (client-to-server and server-to-client) have no fixed relationship to each other at all.',
      ]
    },
    {
      heading: 'Why this independence means one direction needs its own goroutine',
      points: [
        'Both stream.Send and stream.Recv on a bidi stream are blocking calls from the caller\'s perspective — a single goroutine calling stream.Recv() in a loop will sit blocked waiting for the next incoming message, unable to also call stream.Send() to write an outgoing one at the same time. Since the two directions can happen in ANY order relative to each other, a single sequential loop of "receive, then send, then receive again" only works if the actual traffic pattern happens to match that assumption — which the main page\'s own bidirectional-streaming DEFINITION explicitly says is not guaranteed.',
        'The standard, documented pattern — shown directly in the official gRPC Go tutorial\'s own client implementation — launches a SEPARATE goroutine specifically for receiving: go func() { for { in, err := stream.Recv(); ... } }(), while the original goroutine continues sending. This lets both directions genuinely proceed independently and concurrently, exactly matching the independence the protocol itself guarantees, instead of forcing an artificial strict alternation the protocol never promised.',
        'This is the concrete, practical reason bidi streaming is meaningfully harder to implement correctly than the three call types the main page already covers in code — client and server streaming each only need to manage ONE direction\'s worth of blocking Send/Recv calls in a simple loop; bidi streaming needs BOTH directions managed concurrently, which is precisely why it needs its own goroutine-based pattern rather than a simple extension of the client-streaming loop already shown on the main page.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive, WRONG approach: one sequential loop',
      language: 'typescript',
      code: `package main

// This is the INTUITIVE but INCORRECT extension of the main page's
// own client-streaming pattern to bidi streaming -- it assumes a
// strict send-then-receive alternation that the protocol never
// guarantees.
func chatClientWrong(stream pb.ChatService_ChatClient) error {
    messages := []string{"hello", "how are you", "goodbye"}

    for _, msg := range messages {
        if err := stream.Send(&pb.ChatMessage{Text: msg}); err != nil {
            return err
        }
        // PROBLEM: this blocks waiting for a response to THIS
        // specific message before sending the next one -- but per
        // this subtopic's theory, the server is free to respond in
        // any order, batch several responses together, or send
        // nothing back until much later. If the server's actual
        // behavior doesn't match this exact one-for-one assumption,
        // this loop can deadlock waiting for a reply that was never
        // going to come before the server saw MORE client messages.
        reply, err := stream.Recv()
        if err != nil {
            return err
        }
        println("got reply:", reply.Text)
    }
    return stream.CloseSend()
}`,
    },
    {
      label: 'The correct pattern: a separate goroutine for one direction',
      language: 'typescript',
      code: `package main

import (
    "io"
    "log"
    "sync"
)

// chatClient follows the pattern from gRPC's own official Go
// tutorial: a SEPARATE goroutine handles receiving, completely
// independently of the sending loop below -- matching the genuine
// independence of the two stream directions this subtopic's theory
// describes.
func chatClient(stream pb.ChatService_ChatClient) error {
    var wg sync.WaitGroup
    wg.Add(1)

    // Receiving goroutine -- runs concurrently with sending below,
    // with NO assumption about how many sends happen before any
    // particular receive, or vice versa.
    go func() {
        defer wg.Done()
        for {
            in, err := stream.Recv()
            if err == io.EOF {
                return // server closed its side of the stream
            }
            if err != nil {
                log.Println("recv error:", err)
                return
            }
            log.Println("received:", in.Text)
        }
    }()

    // Sending happens on THIS goroutine, independently -- it never
    // blocks waiting for a specific reply before sending the next
    // message, exactly matching the protocol's own independence
    // guarantee.
    messages := []string{"hello", "how are you", "goodbye"}
    for _, msg := range messages {
        if err := stream.Send(&pb.ChatMessage{Text: msg}); err != nil {
            return err
        }
    }
    stream.CloseSend()

    wg.Wait() // wait for the receiving goroutine to see the
               // server's own stream close (io.EOF) before returning
    return nil
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer implements a bidi streaming client for a live-translation service: the client sends audio chunks continuously as the user speaks, and the server sends back translated text chunks as they become ready — but the server may batch several audio chunks together before producing ONE translated response, and may also send a translated response with no new audio chunk having arrived recently (e.g. finishing a delayed translation). The developer writes the send loop and receive loop as two sequential blocks in the SAME goroutine (send everything first, then start receiving). Using this subtopic\'s theory, explain what goes wrong.',
    hint: 'Per this subtopic\'s theory, are the two directions of a bidi stream required to alternate, or can the server send responses at any time relative to the client\'s own sends? If the client is blocked in a "send everything first" loop, can it also be receiving whatever the server sends back during that same time?',
    solution: 'This design breaks specifically because of the independence this subtopic\'s theory describes: "the two streams operate independently, so clients and servers can read and write in whatever order they like." In this live-translation scenario, the server may start sending back translated text chunks WHILE the client is still in the middle of its own "send everything first" loop, sending more audio chunks — but the client\'s single goroutine is entirely occupied calling stream.Send() in that loop and never reaches its own stream.Recv() calls until sending is completely finished. Since stream.Send() calls are not blocked WAITING on the server (Send just needs the local send buffer to have room, not a reply), the client\'s sends may well succeed and complete, but any translated responses the server sent back DURING that time sit unread in the stream\'s own receive buffer until the client\'s single goroutine finally reaches its receive loop afterward — in the best case, batched together and processed all at once, potentially much later than when a live-translation feature would actually want a user to see partial translations appear as they speak, and in the worst case, if the buffer or connection has any capacity limits, this delay in reading could eventually cause backpressure problems on the server side. The fix, per this subtopic\'s second code example, is a separate goroutine handling receives CONCURRENTLY with the send loop, not sequentially after it — letting translated responses be processed and displayed to the user as soon as the server sends them, regardless of how much more audio the client is still in the process of sending.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own client-streaming pattern uses a simple loop of Send calls followed by a single final Recv-equivalent, bidirectional streaming should work the same way, just with more back-and-forth — a loop alternating Send, then Recv, then Send again, matching request/response pairs one-to-one.',
      reality: 'This subtopic\'s theory and first code example show this assumption is exactly what the protocol explicitly does NOT guarantee: "clients and servers can read and write in whatever order they like." A strict one-for-one Send/Recv alternation only happens to work if the actual server behavior coincidentally matches that pattern — it is not a safe assumption to build a bidi streaming client around, unlike the genuinely sequential client-streaming pattern the main page already covers.'
    },
    {
      thought: 'The separate goroutine used for receiving in a correct bidi streaming implementation is mainly a performance optimization — running receive and send concurrently is faster than doing them sequentially, but a sequential "send phase then receive phase" implementation would still be functionally correct, just slower.',
      reality: 'This subtopic\'s exercise shows the goroutine is not merely a performance choice — a sequential send-then-receive implementation can produce genuinely WRONG or delayed behavior whenever the server sends responses before the client finishes its own send loop, which the protocol explicitly permits. The separate goroutine is a correctness requirement for handling the full range of server behavior the protocol allows, not an optional speed optimization.'
    },
    {
      thought: '"The order of messages in each stream is preserved," a guarantee this subtopic\'s own theory quotes, means the overall sequence of client sends and server sends together forms one single, predictable, interleaved order that both sides can rely on.',
      reality: 'This subtopic\'s theory is precise about scope: the preserved-order guarantee applies WITHIN each direction separately (client messages arrive at the server in the order the client sent them; server messages arrive at the client in the order the server sent them) — it says nothing about how the two SEPARATE, independently-ordered streams interleave relative to each other, which is exactly the part the protocol leaves unconstrained.'
    }
  ];
}
