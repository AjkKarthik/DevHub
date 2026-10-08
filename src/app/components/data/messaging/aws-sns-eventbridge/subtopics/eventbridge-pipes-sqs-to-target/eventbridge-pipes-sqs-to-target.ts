import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-eb-pipes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './eventbridge-pipes-sqs-to-target.html',
  styleUrl: './eventbridge-pipes-sqs-to-target.scss'
})
export class EventbridgePipesSqsToTargetSubtopic {
  topicLabel = 'AWS SNS & EventBridge';
  topicRoute = '/messaging/aws-sns-eventbridge';

  theory: TheoryPoint[] = [
    {
      heading: 'What a Pipe Actually Configures',
      points: [
        'The main page describes Pipes as connecting a source to a target "without writing glue code" -- concretely, that means a Pipe is a resource with a Source ARN, a Target ARN, an IAM RoleArn, and optional SourceParameters, Enrichment, and TargetParameters, created in one CreatePipeCommand call.',
        'For an SQS source, SourceParameters.SqsQueueParameters controls how the Pipe polls the queue -- BatchSize sets how many messages to pull per poll, the same knob a hand-written consumer would set on ReceiveMessageCommand.',
        'Filtering happens INSIDE the Pipe, between source and target: SourceParameters.FilterCriteria.Filters is a list of JSON pattern strings evaluated against the received record, so only matching messages ever reach the target at all -- the target never sees, and never has to filter out, the rest.'
      ]
    },
    {
      heading: 'The Filter Pattern Matches the Record Shape, Not Just the Payload',
      points: [
        'An SQS-sourced Pipe filter pattern is matched against the record EventBridge Pipes builds from the SQS message, not directly against the raw MessageBody string -- a pattern like { "body": { "status": ["PENDING"] } } only works if the message body is itself valid JSON that Pipes can parse and match into.',
        'This is the same content-based filtering idea the main page\'s own EventBridge Rule already uses (event pattern matching against a payload before delivery) -- Pipes applies the identical idea one step upstream, filtering what a queue delivers into a pipeline rather than what a bus routes out of one.',
        'A Pipe with no FilterCriteria at all still does useful work: it is the plumbing between source and target (with optional enrichment) even when every record is allowed through -- filtering is an optional refinement, not what makes something a Pipe.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create a Pipe: SQS source, filtered, to an EventBridge bus target',
      language: 'typescript',
      code: `import { PipesClient, CreatePipeCommand } from '@aws-sdk/client-pipes';

const pipes = new PipesClient({ region: 'us-east-1' });

async function createFilteredOrderPipe(sqsArn: string, busArn: string, roleArn: string) {
  await pipes.send(new CreatePipeCommand({
    Name:   'pending-orders-pipe',
    Source: sqsArn,
    Target: busArn,
    RoleArn: roleArn,

    SourceParameters: {
      SqsQueueParameters: {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
      },
      // Only messages whose JSON body has status = "PENDING" reach the target.
      // The target never sees, and never has to filter out, anything else.
      FilterCriteria: {
        Filters: [
          { Pattern: JSON.stringify({ body: { status: ['PENDING'] } }) },
        ],
      },
    },

    TargetParameters: {
      EventBridgeEventBusParameters: {
        DetailType: 'order.pending',
        Source:     'pending-orders-pipe',
      },
    },

    DesiredState: 'RUNNING',
  }));
  console.log('Pipe created: pending-orders-pipe');
}`
    },
    {
      label: 'Enrichment: transform before the target sees it',
      language: 'typescript',
      code: `import { PipesClient, CreatePipeCommand } from '@aws-sdk/client-pipes';

const pipes = new PipesClient({ region: 'us-east-1' });

// An enrichment resource (Lambda function) runs BETWEEN filter and target,
// and its return value -- not the original record -- is what the target receives.
async function createEnrichedOrderPipe(
  sqsArn: string, enrichLambdaArn: string, targetArn: string, roleArn: string
) {
  await pipes.send(new CreatePipeCommand({
    Name:        'enriched-orders-pipe',
    Source:      sqsArn,
    Enrichment:  enrichLambdaArn,   // Lambda that looks up customer tier, etc.
    Target:      targetArn,
    RoleArn:     roleArn,

    SourceParameters: {
      SqsQueueParameters: { BatchSize: 10 },
    },

    EnrichmentParameters: {
      InputTemplate: '{ "orderId": <$.body.orderId>, "region": <$.body.region> }',
    },

    DesiredState: 'RUNNING',
  }));
  console.log('Pipe created: enriched-orders-pipe (filter -> enrich -> target)');
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to route only SQS messages whose JSON body has "status": "PENDING" to a downstream Lambda, and they configure a Pipe with SourceParameters.FilterCriteria matching { "body": { "status": ["PENDING"] } }. Messages keep reaching the Lambda regardless of their status field. What is the most likely reason the filter is not working?',
    hint: 'Check what the FilterCriteria pattern is actually matched against -- and what has to be true about the SQS message body for that match to work at all.',
    solution: 'The most likely cause is that the SQS message body is not valid JSON, or the status field is not at the path the pattern expects. Pipes matches the filter pattern against the STRUCTURED record it builds from the message -- for an SQS source, that means parsing the body as JSON first. If the body is a plain string, a differently-shaped JSON object, or the field is nested somewhere other than body.status, the pattern never matches anything, and (depending on how FilterCriteria is configured) that can mean everything passes through unfiltered rather than everything being blocked.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'EventBridge Pipes filter on the raw SQS message body string.',
      reality: 'The filter pattern matches against a structured record Pipes builds from the source -- for SQS, that means the body needs to be parseable JSON for a filter like { "body": { "status": [...] } } to match anything at all.'
    },
    {
      thought: 'A Pipe with no FilterCriteria configured is not really doing anything.',
      reality: 'Filtering is optional. A Pipe with no filters still connects source to target (with optional enrichment) -- it just lets every record through, which is a legitimate, deliberate configuration.'
    },
    {
      thought: 'Enrichment and the target both receive the same original record.',
      reality: 'When Enrichment is configured, the target receives whatever the enrichment step (a Lambda, Step Functions, or API Destination) returns -- not the original source record.'
    }
  ];
}
