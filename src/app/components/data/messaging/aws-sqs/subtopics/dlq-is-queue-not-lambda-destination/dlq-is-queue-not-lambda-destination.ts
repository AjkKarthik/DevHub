import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sqs-dlq-lambda',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dlq-is-queue-not-lambda-destination.html',
  styleUrl: './dlq-is-queue-not-lambda-destination.scss'
})
export class DlqIsQueueNotLambdaDestinationSubtopic {
  topicLabel = 'AWS SQS';
  topicRoute = '/messaging/aws-sqs';

  theory: TheoryPoint[] = [
    {
      heading: 'Why "Lambda Destination" Is the Wrong Mental Model for SQS',
      points: [
        'Lambda Destinations exist for stream-based event sources (DynamoDB Streams, Kinesis) and for asynchronous invocations (S3, SNS, EventBridge triggers) -- an on-failure destination configured directly on the function or the event source mapping.',
        'SQS event source mappings have no such mechanism. When a batch invocation fails, Lambda simply lets the messages become visible again once their visibility timeout expires -- there is no Lambda-side setting that routes them anywhere else.',
        'Dead-lettering for an SQS-triggered Lambda is configured entirely on the SQS QUEUE itself, via the same RedrivePolicy (deadLetterTargetArn + maxReceiveCount) already used for any other SQS consumer -- Lambda is just one more consumer polling that queue.'
      ]
    },
    {
      heading: 'What This Means for Where You Configure Failure Handling',
      points: [
        'Because the redrive policy lives on the queue, it applies identically whether the consumer is a Lambda function, an EC2-hosted worker, or a container task -- swapping the consumer never requires reconfiguring dead-lettering.',
        'A missing or too-low maxReceiveCount is a queue-configuration bug, not a Lambda-configuration bug -- debugging it means checking the SQS queue\'s own attributes, not the Lambda function\'s destinations or event source mapping settings.',
        'This is the opposite of DynamoDB Streams or Kinesis, where failure handling genuinely does live on the Lambda side (the event source mapping\'s own DestinationConfig.OnFailure) -- the same "where do I configure this" question has a different answer per source type.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: where failure handling actually lives, per source',
      language: 'typescript',
      code: `type EventSource = 'sqs' | 'dynamodb-streams' | 'kinesis';

interface FailureHandlingLocation {
  configuredOn: 'sqs-queue-redrive-policy' | 'event-source-mapping-destination';
  supportsLambdaDestination: boolean;
}

const FAILURE_HANDLING: Record<EventSource, FailureHandlingLocation> = {
  sqs: {
    configuredOn: 'sqs-queue-redrive-policy',
    supportsLambdaDestination: false,
  },
  'dynamodb-streams': {
    configuredOn: 'event-source-mapping-destination',
    supportsLambdaDestination: true,
  },
  kinesis: {
    configuredOn: 'event-source-mapping-destination',
    supportsLambdaDestination: true,
  },
};

function whereDoIConfigureDeadLettering(source: EventSource): string {
  const info = FAILURE_HANDLING[source];
  if (!info.supportsLambdaDestination) {
    return \`Configure a RedrivePolicy directly on the \${source} resource -- Lambda has no say in it.\`;
  }
  return \`Configure an OnFailure destination on the event source mapping itself.\`;
}

console.log(whereDoIConfigureDeadLettering('sqs'));
// Configure a RedrivePolicy directly on the sqs resource -- Lambda has no say in it.

console.log(whereDoIConfigureDeadLettering('dynamodb-streams'));
// Configure an OnFailure destination on the event source mapping itself.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team building a Lambda function triggered by both a DynamoDB Stream and an SQS queue wants ONE consistent place to configure "where do failed records go." They plan to set an on-failure destination on both event source mappings. Will that work for both?',
    hint: 'Check which of the two source types actually supports a Lambda-side on-failure destination at all.',
    solution: 'Only half of it will work. The DynamoDB Stream event source mapping genuinely supports an OnFailure destination configured on the mapping itself. The SQS event source mapping does not -- there is no equivalent setting on the Lambda side at all. For the SQS-triggered path, dead-lettering has to be configured separately, on the SQS queue\'s own RedrivePolicy, not on the event source mapping.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'You can configure an on-failure destination for an SQS-triggered Lambda, the same way you can for DynamoDB Streams or Kinesis.',
      reality: 'SQS event source mappings have no on-failure destination at all. Dead-lettering is handled exclusively by the RedrivePolicy on the SQS queue itself.'
    },
    {
      thought: 'If a Lambda function fails to process an SQS batch, the messages are lost unless a Lambda destination is configured.',
      reality: 'Nothing is lost by default -- the messages simply become visible again once their visibility timeout expires, and SQS retries delivery. A DLQ is what prevents INDEFINITE retries, not what prevents immediate loss.'
    },
    {
      thought: 'Failure-handling configuration works the same way across every Lambda event source.',
      reality: 'It genuinely differs by source type: DynamoDB Streams and Kinesis support a Lambda-side OnFailure destination; SQS relies entirely on the queue\'s own RedrivePolicy instead.'
    }
  ];
}
