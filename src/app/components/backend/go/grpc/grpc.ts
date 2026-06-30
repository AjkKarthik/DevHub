import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-go-grpc',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grpc.html',
  styleUrl: './grpc.scss'
})
export class GoGrpc {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = 'gRPC-Go v1.60+';
  route = 'go-grpc';
  nextRoute = '/go/pgx';
  nextLabel = 'pgx (PostgreSQL)';

  quickRef: QuickRefItem[] = [
    { name: 'protoc --go_out --go-grpc_out', type: 'syntax', desc: 'Generate Go types and gRPC service stubs from .proto file' },
    { name: 'grpc.NewServer(opts...)', type: 'function', desc: 'Create gRPC server; add interceptors, TLS, keepalive here' },
    { name: 'pb.RegisterXxxServer(s, impl)', type: 'function', desc: 'Register your service implementation with the server' },
    { name: 'grpc.Dial / grpc.NewClient(addr, opts...)', type: 'function', desc: 'Create a client connection (use grpc.NewClient in v1.65+)' },
    { name: 'pb.NewXxxClient(conn)', type: 'function', desc: 'Create typed service client from the connection' },
    { name: 'status.Errorf(codes.NotFound, "msg")', type: 'function', desc: 'Return a gRPC status error from a server handler' },
    { name: 'status.FromError(err)', type: 'function', desc: 'Check if an error is a gRPC Status error on the client side' },
    { name: 'grpc.UnaryInterceptor(fn)', type: 'function', desc: 'Server-side middleware for unary RPC calls' },
    { name: 'metadata.NewIncomingContext / FromIncomingContext', type: 'function', desc: 'Read request metadata (headers) in a server handler' },
    { name: 'stream.Send / stream.Recv', type: 'method', desc: 'Send and receive messages on a server or client stream' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is gRPC?',
      points: [
        'gRPC is a high-performance RPC framework using HTTP/2 for transport and Protocol Buffers for serialisation.',
        'Proto files define services and messages — protoc generates Go code. The generated code handles all serialisation, connection management, and streaming.',
        'gRPC has four call types: Unary (1 req → 1 resp), Server Streaming (1 req → N resps), Client Streaming (N reqs → 1 resp), Bidirectional Streaming (N ↔ N).',
        'Advantages over REST+JSON: strongly typed contracts, smaller payloads (binary protobuf), built-in streaming, automatic code generation, and context propagation.',
        'gRPC is the standard for internal microservice communication where performance and type safety matter more than browser compatibility.',
      ]
    },
    {
      heading: 'Proto definitions and code generation',
      points: [
        'A .proto file defines messages (structs) and services (RPC methods). Run protoc to generate *_grpc.pb.go and *.pb.go files.',
        'Install: go install google.golang.org/protobuf/cmd/protoc-gen-go@latest and google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest.',
        'Generate: protoc --go_out=. --go-grpc_out=. --proto_path=proto proto/*.proto',
        'Generated server interface has UnimplementedXxxServer — embed it in your implementation for forward compatibility.',
        'Never edit generated files — regenerate from the .proto source. Track both .proto and generated files in git.',
      ]
    },
    {
      heading: 'Server implementation',
      points: [
        'Implement the generated service interface. Each method receives context.Context and returns (Response, error).',
        'Return gRPC status errors: status.Errorf(codes.NotFound, "user %s not found", id). Never return plain errors.',
        'Pass context to all downstream calls — gRPC propagates deadlines and cancellation automatically between client and server.',
        'Register your implementation: pb.RegisterUserServiceServer(grpcServer, &userServer{}).',
        'Run on a TCP listener: lis, _ := net.Listen("tcp", ":50051"); grpcServer.Serve(lis).',
      ]
    },
    {
      heading: 'Client usage',
      points: [
        'Create a connection with grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials())) for local/dev.',
        'Pass context with deadline to every client call — gRPC propagates the deadline to the server automatically.',
        'Handle gRPC status errors: st, ok := status.FromError(err); switch st.Code() { case codes.NotFound: ... }.',
        'Reuse the connection (grpc.ClientConn) across requests — it manages the underlying HTTP/2 multiplexed streams.',
        'For production: use TLS credentials and load-balanced connections via a service mesh or DNS resolver.',
      ]
    },
    {
      heading: 'Interceptors and metadata',
      points: [
        'Interceptors (middleware) are attached to the server with grpc.UnaryInterceptor or grpc.ChainUnaryInterceptor.',
        'They receive the handler function and call it: return handler(ctx, req). Before/after hook by wrapping the call.',
        'Metadata is key-value pairs sent like HTTP headers: metadata.NewOutgoingContext(ctx, md) on the client, metadata.FromIncomingContext(ctx) on the server.',
        'Common interceptor uses: logging, auth token validation, rate limiting, distributed tracing (OpenTelemetry).',
        'grpc-ecosystem/go-grpc-middleware provides composable interceptor chains and popular integrations.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proto Definition',
      language: 'typescript',
      code: `// proto/user.proto
syntax = "proto3";

package user.v1;
option go_package = "example.com/myapp/gen/user/v1;userv1";

// Message definitions
message GetUserRequest {
    string id = 1;
}

message User {
    string id    = 1;
    string name  = 2;
    string email = 3;
    int32  age   = 4;
}

message CreateUserRequest {
    string name  = 1;
    string email = 2;
    int32  age   = 3;
}

message ListUsersRequest {
    int32 page_size = 1;
}

// Service definition
service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc CreateUser(CreateUserRequest) returns (User);

    // Server streaming: client sends 1 request, server sends N users
    rpc ListUsers(ListUsersRequest) returns (stream User);
}

// Generate with:
// protoc --go_out=. --go-grpc_out=. --proto_path=proto proto/user.proto`
    },
    {
      label: 'Server',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "log"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"

    pb "example.com/myapp/gen/user/v1"
)

// userServer implements pb.UserServiceServer
type userServer struct {
    pb.UnimplementedUserServiceServer // embed for forward compatibility
    users map[string]*pb.User
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    u, ok := s.users[req.Id]
    if !ok {
        return nil, status.Errorf(codes.NotFound, "user %q not found", req.Id)
    }
    return u, nil
}

func (s *userServer) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.User, error) {
    if req.Name == "" {
        return nil, status.Errorf(codes.InvalidArgument, "name is required")
    }
    id := fmt.Sprintf("u%d", len(s.users)+1)
    u := &pb.User{Id: id, Name: req.Name, Email: req.Email, Age: req.Age}
    s.users[id] = u
    return u, nil
}

// Server streaming — send each user separately
func (s *userServer) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    count := int(req.PageSize)
    if count == 0 { count = 10 }
    sent := 0
    for _, u := range s.users {
        if sent >= count { break }
        if err := stream.Send(u); err != nil {
            return err // client disconnected
        }
        sent++
    }
    return nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("listen: %v", err)
    }
    s := grpc.NewServer()
    pb.RegisterUserServiceServer(s, &userServer{
        users: map[string]*pb.User{
            "u1": {Id: "u1", Name: "Alice", Email: "alice@example.com", Age: 30},
        },
    })
    log.Println("gRPC server listening on :50051")
    log.Fatal(s.Serve(lis))
}`
    },
    {
      label: 'Client',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "io"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/credentials/insecure"
    "google.golang.org/grpc/status"

    pb "example.com/myapp/gen/user/v1"
)

func main() {
    // Create connection — reuse across all calls
    conn, err := grpc.NewClient(
        "localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatalf("connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewUserServiceClient(conn)

    // Unary call with deadline
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    user, err := client.GetUser(ctx, &pb.GetUserRequest{Id: "u1"})
    if err != nil {
        // Type-safe error handling
        st, ok := status.FromError(err)
        if ok && st.Code() == codes.NotFound {
            fmt.Println("user not found")
            return
        }
        log.Fatalf("GetUser: %v", err)
    }
    fmt.Printf("Got user: %s (%s)\\n", user.Name, user.Email)

    // Server streaming
    stream, err := client.ListUsers(ctx, &pb.ListUsersRequest{PageSize: 5})
    if err != nil {
        log.Fatalf("ListUsers: %v", err)
    }
    for {
        u, err := stream.Recv()
        if err == io.EOF {
            break // stream done
        }
        if err != nil {
            log.Fatalf("stream recv: %v", err)
        }
        fmt.Println("streamed:", u.Name)
    }
}`
    },
    {
      label: 'Interceptors',
      language: 'typescript',
      code: `package main

import (
    "context"
    "log"
    "net"
    "strings"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/metadata"
    "google.golang.org/grpc/status"
)

// loggingInterceptor logs each unary RPC with its duration
func loggingInterceptor(
    ctx context.Context,
    req any,
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (any, error) {
    start := time.Now()
    resp, err := handler(ctx, req) // call the actual handler
    log.Printf("RPC %s duration=%v err=%v", info.FullMethod, time.Since(start), err)
    return resp, err
}

// authInterceptor validates a Bearer token from metadata
func authInterceptor(
    ctx context.Context,
    req any,
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (any, error) {
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }
    tokens := md.Get("authorization")
    if len(tokens) == 0 || !strings.HasPrefix(tokens[0], "Bearer ") {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }
    // Optionally attach parsed user to ctx: ctx = context.WithValue(ctx, userKey{}, parsedUser)
    return handler(ctx, req)
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")

    // Chain multiple interceptors — outermost runs first
    s := grpc.NewServer(
        grpc.ChainUnaryInterceptor(loggingInterceptor, authInterceptor),
    )
    s.Serve(lis)
}`
    },
    {
      label: 'Metadata',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"

    "google.golang.org/grpc/metadata"
)

// === CLIENT SIDE ===
func clientCall(ctx context.Context) context.Context {
    // Attach metadata to outgoing context
    md := metadata.Pairs(
        "authorization", "Bearer my-token",
        "x-request-id",  "req-abc-123",
        "x-api-version",  "v2",
    )
    return metadata.NewOutgoingContext(ctx, md)
}

// === SERVER SIDE ===
func serverHandler(ctx context.Context) {
    // Read incoming metadata
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        fmt.Println("no metadata")
        return
    }

    // Get returns []string — metadata keys can have multiple values
    authValues := md.Get("authorization")
    if len(authValues) > 0 {
        fmt.Println("auth:", authValues[0])
    }

    requestID := md.Get("x-request-id")
    if len(requestID) > 0 {
        fmt.Println("request-id:", requestID[0])
    }
}

// === SENDING RESPONSE HEADERS (server → client) ===
// In a server handler:
//   header := metadata.Pairs("x-custom-header", "value")
//   grpc.SendHeader(ctx, header)  // sends immediately
//   grpc.SetTrailer(ctx, trailer) // sent after handler returns
//
// On client, read with:
//   var header, trailer metadata.MD
//   client.GetUser(ctx, req, grpc.Header(&header), grpc.Trailer(&trailer))`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning plain errors instead of gRPC status errors',
      wrong: `func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    return nil, errors.New("user not found") // client gets codes.Unknown
}`,
      right: `func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    return nil, status.Errorf(codes.NotFound, "user %q not found", req.Id)
}`,
      explanation: 'Plain errors are transmitted as codes.Unknown (code 2) — the client loses all status information. Always return gRPC status errors with an appropriate code (NotFound, InvalidArgument, Internal, etc.) so clients can handle errors programmatically.'
    },
    {
      title: 'Not embedding UnimplementedXxxServer',
      wrong: `type myServer struct{} // does not embed UnimplementedUserServiceServer

// Adding a new RPC to the .proto and regenerating now causes compile error:
// myServer does not implement UserServiceServer (missing NewMethod)`,
      right: `type myServer struct {
    pb.UnimplementedUserServiceServer // embed for forward compatibility
}`,
      explanation: 'The generated interface includes all RPCs. Without the Unimplemented embed, adding any new RPC to the proto and regenerating breaks compilation of all existing server implementations. The embed provides default implementations that return Unimplemented, making upgrades non-breaking.'
    },
    {
      title: 'Creating a new gRPC connection per call',
      wrong: `func callService(req *pb.Request) (*pb.Response, error) {
    conn, _ := grpc.NewClient(addr, opts...)
    defer conn.Close() // new TCP+TLS handshake every call!
    return pb.NewMyServiceClient(conn).Method(ctx, req)
}`,
      right: `// Create once at startup, reuse across all calls
var conn *grpc.ClientConn
func init() {
    conn, _ = grpc.NewClient(addr, opts...)
}
func callService(req *pb.Request) (*pb.Response, error) {
    return pb.NewMyServiceClient(conn).Method(ctx, req)
}`,
      explanation: 'gRPC connections multiplex many calls over a single HTTP/2 connection. Creating a new connection per call incurs TCP handshake, TLS negotiation, and HTTP/2 stream setup overhead for every request. Create the connection once at startup and reuse it for the lifetime of the process.'
    },
    {
      title: 'Not passing context to gRPC calls (no deadline)',
      wrong: `user, err := client.GetUser(context.Background(), req)
// context.Background() never cancels — server keeps processing even if caller gives up`,
      right: `ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
user, err := client.GetUser(ctx, req)`,
      explanation: 'context.Background() has no deadline — if the server is slow, the client waits forever. gRPC propagates context deadlines to the server: when the client context is cancelled, the server handler\'s ctx is also cancelled, stopping wasted work on both sides.'
    },
    {
      title: 'Ignoring stream.Recv() EOF check in streaming RPCs',
      wrong: `for {
    msg, err := stream.Recv()
    if err != nil {
        log.Fatal(err) // io.EOF is treated as an error — crashes
    }
    process(msg)
}`,
      right: `for {
    msg, err := stream.Recv()
    if err == io.EOF {
        break // stream finished normally
    }
    if err != nil {
        return fmt.Errorf("recv: %w", err) // real error
    }
    process(msg)
}`,
      explanation: 'When a server streaming RPC completes normally, stream.Recv() returns (nil, io.EOF). This is the normal end-of-stream signal, not an error. Treating it as a fatal error will crash or incorrectly error on every successful streaming call.'
    },
    {
      title: 'Checking gRPC errors with == instead of status codes',
      wrong: `_, err := client.GetUser(ctx, req)
if err != nil && err.Error() == "rpc error: code = NotFound ..." {
    // brittle string matching
}`,
      right: `_, err := client.GetUser(ctx, req)
if st, ok := status.FromError(err); ok {
    switch st.Code() {
    case codes.NotFound:
        // handle not found
    case codes.DeadlineExceeded:
        // handle timeout
    }
}`,
      explanation: 'gRPC errors carry a status code and message. Never string-match the error message — it can change between library versions and languages. Use status.FromError(err) to get the typed Status, then switch on st.Code() for robust error handling.'
    },
  ];

  challenge: Challenge = {
    title: 'Calculator gRPC Service',
    language: 'typescript',
    description: `Design and implement a simple Calculator gRPC service.

**Proto definition (given):**
\`\`\`proto
service Calculator {
    rpc Add(BinaryOp) returns (Result);
    rpc Divide(BinaryOp) returns (Result);
    rpc Sum(stream Number) returns (Result);   // client streaming
}
message BinaryOp { double a = 1; double b = 2; }
message Number    { double value = 1; }
message Result    { double value = 1; }
\`\`\`

Implement the server:
- \`Add\` — return a + b
- \`Divide\` — return a / b; return \`codes.InvalidArgument\` if b == 0
- \`Sum\` — read a stream of Numbers from the client and return their sum when the stream ends

The server must embed \`UnimplementedCalculatorServer\`.`,
    hints: [
      'Divide by zero: return nil, status.Errorf(codes.InvalidArgument, "division by zero")',
      'Client streaming Sum: call stream.Recv() in a loop until io.EOF, then stream.SendAndClose(&pb.Result{...})',
      'Register: pb.RegisterCalculatorServer(s, &calcServer{})',
      'Embed pb.UnimplementedCalculatorServer in your struct',
    ],
    starterCode: `package main

import (
    "context"
    "io"
    "log"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"

    pb "example.com/calc/gen"
)

type calcServer struct {
    pb.UnimplementedCalculatorServer
}

func (s *calcServer) Add(ctx context.Context, req *pb.BinaryOp) (*pb.Result, error) {
    // TODO
    return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *calcServer) Divide(ctx context.Context, req *pb.BinaryOp) (*pb.Result, error) {
    // TODO: handle division by zero
    return nil, status.Error(codes.Unimplemented, "not implemented")
}

func (s *calcServer) Sum(stream pb.Calculator_SumServer) error {
    // TODO: read stream, return total
    return status.Error(codes.Unimplemented, "not implemented")
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil { log.Fatal(err) }
    s := grpc.NewServer()
    pb.RegisterCalculatorServer(s, &calcServer{})
    log.Println("listening on :50051")
    log.Fatal(s.Serve(lis))
}`,
    solution: `package main

import (
    "context"
    "io"
    "log"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"

    pb "example.com/calc/gen"
)

type calcServer struct {
    pb.UnimplementedCalculatorServer
}

func (s *calcServer) Add(ctx context.Context, req *pb.BinaryOp) (*pb.Result, error) {
    return &pb.Result{Value: req.A + req.B}, nil
}

func (s *calcServer) Divide(ctx context.Context, req *pb.BinaryOp) (*pb.Result, error) {
    if req.B == 0 {
        return nil, status.Errorf(codes.InvalidArgument, "division by zero")
    }
    return &pb.Result{Value: req.A / req.B}, nil
}

func (s *calcServer) Sum(stream pb.Calculator_SumServer) error {
    var total float64
    for {
        num, err := stream.Recv()
        if err == io.EOF {
            return stream.SendAndClose(&pb.Result{Value: total})
        }
        if err != nil {
            return err
        }
        total += num.Value
    }
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil { log.Fatal(err) }
    s := grpc.NewServer()
    pb.RegisterCalculatorServer(s, &calcServer{})
    log.Println("listening on :50051")
    log.Fatal(s.Serve(lis))
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What are the four gRPC call types?',
      options: [
        'Unary, Server Streaming, Client Streaming, Bidirectional Streaming',
        'GET, POST, PUT, DELETE',
        'Sync, Async, Buffered, Unbuffered',
        'Request-Reply, Publish-Subscribe, Push, Pull',
      ],
      answer: 0,
      explanation: 'gRPC supports four call types defined in the proto service: Unary (1 req → 1 resp), Server Streaming (1 req → N resps), Client Streaming (N reqs → 1 resp), and Bidirectional Streaming (N reqs ↔ N resps). The streaming types use HTTP/2 streams.'
    },
    {
      q: 'Why should you always embed UnimplementedXxxServer in your server struct?',
      options: [
        'It provides default implementations so adding new RPCs to the proto does not break existing code',
        'It enables request logging for all methods automatically',
        'Without it, the server panics on startup',
        'It makes the struct satisfy the http.Handler interface',
      ],
      answer: 0,
      explanation: 'The generated interface includes all RPCs. If you add a new RPC to the .proto and regenerate, any server struct that does not embed Unimplemented will fail to compile. The embed provides default "Unimplemented" responses for new methods, making proto evolution non-breaking.'
    },
    {
      q: 'How should you handle errors in a gRPC server handler?',
      options: [
        'Return status.Errorf(codes.NotFound, "message") — never return plain errors',
        'Return fmt.Errorf("message") — gRPC converts all errors to status automatically',
        'Call log.Fatal and return nil',
        'Panic — gRPC recovery interceptors catch all panics',
      ],
      answer: 0,
      explanation: 'Plain errors are transmitted as codes.Unknown (code 2), losing all semantic information. Always return status.Errorf(codes.NotFound, ...) or status.Error(code, msg) with an appropriate status code so the client can handle the error programmatically.'
    },
    {
      q: 'How do you detect the end of a server streaming RPC on the client?',
      options: [
        'stream.Recv() returns (nil, io.EOF) — this is the normal end-of-stream signal',
        'stream.Recv() returns (nil, nil) when done',
        'stream.Close() must be called to get the final message',
        'The stream automatically closes the loop variable',
      ],
      answer: 0,
      explanation: 'For streaming RPCs, stream.Recv() returns io.EOF when the server has finished sending all messages and closed the stream. This is not an error — break out of the loop when err == io.EOF. Any other non-nil error is a real failure.'
    },
    {
      q: 'What is the correct way to handle gRPC status codes on the client side?',
      options: [
        'st, ok := status.FromError(err); switch st.Code() { case codes.NotFound: ... }',
        'if err.Error() == "not found" { ... }',
        'switch err.(type) { case *grpc.StatusError: ... }',
        'if errors.Is(err, grpc.ErrNotFound) { ... }',
      ],
      answer: 0,
      explanation: 'gRPC errors are wrapped Status types. status.FromError(err) extracts the typed Status; st.Code() returns the codes.Code. Never string-match error messages — codes are stable across languages and library versions, but the message format can change.'
    },
    {
      q: 'What is the difference between unary and streaming gRPC RPCs?',
      options: ['They are identical at the transport level', 'Unary = one request/one response; streaming allows sending multiple messages in sequence on either the client, server, or both sides', 'Streaming requires WebSockets', 'Unary is deprecated'],
      answer: 1,
      explanation: 'gRPC supports four patterns: Unary (1 req / 1 resp), Server Streaming (1 req / N resp — e.g., live data feed), Client Streaming (N req / 1 resp — e.g., file upload), Bidirectional Streaming (N req / N resp interleaved — e.g., chat). All use the same HTTP/2 connection with multiplexed streams. Define them in the .proto with the stream keyword on the message type.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use gRPC instead of REST?',
      a: 'Use gRPC for internal microservice communication where you control both client and server: it offers stronger typing, smaller payloads, built-in streaming, and automatic code generation. Use REST for public APIs, browser clients, and third-party integrations — REST is universally accessible without code generation. Many teams use both: REST for public-facing APIs and gRPC for internal service-to-service calls.'
    },
    {
      q: 'How does gRPC propagate deadlines?',
      a: 'When you call a gRPC method with a context that has a deadline (context.WithTimeout or context.WithDeadline), gRPC encodes the remaining time as metadata and sends it to the server. The server reconstructs a context with the same deadline. If the client cancels its context, the server\'s handler context is also cancelled — all downstream calls that check ctx.Done() stop automatically. This is why you should always pass ctx to downstream DB queries and other gRPC calls inside a handler.'
    },
    {
      q: 'What is the difference between grpc.Dial and grpc.NewClient?',
      a: 'grpc.Dial is the older API that connects eagerly by default. grpc.NewClient (introduced in gRPC-Go v1.65) is the recommended replacement: it connects lazily (on first call), has cleaner option semantics, and better aligns with the gRPC spec. For new code, use grpc.NewClient. Both return a *grpc.ClientConn — the rest of the client API is identical.'
    },
    {
      q: 'How do I add authentication to a gRPC server?',
      a: 'Use a UnaryInterceptor (and a StreamInterceptor for streaming RPCs). In the interceptor, read the authorization metadata from the incoming context with metadata.FromIncomingContext(ctx), validate the token, and either call handler(ctx, req) to proceed or return status.Error(codes.Unauthenticated, "invalid token") to reject. Attach enriched context (e.g. the authenticated user) with context.WithValue before passing to handler.'
    },
    {
      q: 'Can gRPC be used from a browser?',
      a: 'Not directly — browsers cannot make raw HTTP/2 requests. grpc-web is a proxy-based solution: a grpc-web client (JavaScript) connects to an Envoy/nginx proxy that translates to real gRPC. A newer alternative is Connect (connectrpc.com), which is compatible with both gRPC and browsers over HTTP/1.1 or HTTP/2. For fully browser-based APIs, REST or GraphQL are simpler choices.'
    },
    {
      q: 'How do I test a gRPC service?',
      a: 'For unit tests: call the server methods directly without a network. For integration tests: use bufconn (google.golang.org/grpc/test/bufconn) — it creates an in-memory listener and a matching client connection, giving you a full gRPC stack without binding to a port. grpcurl is a command-line tool like curl for manual testing. google.golang.org/grpc/interop has conformance tests for streaming behaviour.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'gRPC uses protobuf + HTTP/2 for typed, efficient RPC — define in .proto, generate code, return status errors, pass context for deadline propagation.',
    mustKnow: [
      'Four call types: Unary, Server Streaming, Client Streaming, Bidirectional Streaming.',
      'Always embed UnimplementedXxxServer for forward compatibility.',
      'Return status.Errorf(codes.NotFound, "...") — never plain errors.',
      'Reuse the grpc.ClientConn — do not create per-call connections.',
      'Always pass context with deadline to gRPC calls — propagated to the server automatically.',
      'stream.Recv() returns io.EOF at end of stream — not an error, break the loop.',
      'Use status.FromError(err) + st.Code() for type-safe client-side error handling.',
    ],
    interviewFocus: [
      'What are the four gRPC call types and when would you use each?',
      'How does gRPC propagate deadlines between client and server?',
      'Why must you return status errors instead of plain errors from gRPC handlers?',
      'How do you add authentication middleware to a gRPC server?',
      'When would you choose gRPC over REST for a new service?',
    ],
  };
}
