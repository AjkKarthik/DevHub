import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sns-retry-type',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './retry-duration-depends-on-endpoint-type.html',
  styleUrl: './retry-duration-depends-on-endpoint-type.scss'
})
export class RetryDurationDependsOnEndpointTypeSubtopic {
  topicLabel = 'AWS SNS & EventBridge';
  topicRoute = '/messaging/aws-sns-eventbridge';

  theory: TheoryPoint[] = [
    {
      heading: '23 Days Is Real -- For One Specific Endpoint Type',
      points: [
        'For AWS-managed endpoints (SQS, Lambda), SNS genuinely does retry for up to 23 days: 3 immediate retries, 2 more one second apart, 10 with exponential backoff from 1 to 20 seconds, then up to 100,000 further retries 20 seconds apart -- 100,015 total attempts.',
        'That policy is fixed and cannot be changed for AWS-managed endpoints -- it is the one thing the main page\'s own mistake block is correct about, since its example targets an SQS subscription.',
        'HTTP/S endpoints get a completely different, much shorter default: 3 retries, 20 seconds apart -- roughly a minute of total retry window, not 23 days.'
      ]
    },
    {
      heading: 'HTTP/S Is the One Endpoint Type You Can Actually Tune',
      points: [
        'HTTP/S is the only SNS subscription type where the delivery policy is customizable at all -- every other endpoint type (SQS, Lambda, email, SMS, mobile push) uses a fixed, non-configurable policy.',
        'Even a custom HTTP/S delivery policy has a hard ceiling: the total retry window cannot exceed 3,600 seconds (1 hour), which is itself not increasable.',
        'A team building a webhook-style HTTP/S subscriber and assuming "SNS will keep retrying for weeks like it does for our SQS subscriptions" will be surprised: the real window for that endpoint is measured in minutes, capped at an hour even with the most generous custom policy.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: retry schedule by endpoint type',
      language: 'typescript',
      code: `type EndpointType = 'aws-managed' | 'http-default' | 'http-custom';

interface RetrySchedule {
  totalAttempts: number;
  approxTotalWindow: string;
  tunable: boolean;
}

function retrySchedule(endpointType: EndpointType): RetrySchedule {
  switch (endpointType) {
    case 'aws-managed':
      // SQS, Lambda -- fixed, not configurable
      return { totalAttempts: 100_015, approxTotalWindow: '23 days', tunable: false };
    case 'http-default':
      // HTTP/S, no custom delivery policy set
      return { totalAttempts: 4, approxTotalWindow: '~60 seconds', tunable: true };
    case 'http-custom':
      // HTTP/S, custom policy pushed to the hard ceiling
      return { totalAttempts: 50, approxTotalWindow: '3,600 seconds (1 hour, hard max)', tunable: true };
  }
}

console.log(retrySchedule('aws-managed'));
// { totalAttempts: 100015, approxTotalWindow: '23 days', tunable: false }

console.log(retrySchedule('http-default'));
// { totalAttempts: 4, approxTotalWindow: '~60 seconds', tunable: true }
// -- roughly 33,000x shorter than the AWS-managed-endpoint window

console.log(retrySchedule('http-custom'));
// { totalAttempts: 50, approxTotalWindow: '3,600 seconds (1 hour, hard max)', tunable: true }
// -- even the most generous custom policy is still nowhere near 23 days`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team has two SNS subscriptions on the same topic: one to an SQS queue, one to a partner\'s HTTP webhook. Their partner\'s endpoint goes down for 6 hours during a deploy. Which subscription is guaranteed to still successfully deliver the backlog once the endpoint recovers, and which one is not?',
    hint: 'Compare the AWS-managed-endpoint retry window against even the maximum possible HTTP/S retry window.',
    solution: 'The SQS subscription is fine -- 6 hours is nowhere close to its 23-day, 100,015-attempt retry window, so every message is still being retried when the endpoint recovers. The HTTP webhook subscription is NOT guaranteed to recover: even with the most generous possible custom delivery policy, the retry window caps at 3,600 seconds (1 hour) total. Anything published more than an hour before the endpoint came back is already gone -- dropped, or dead-lettered if a subscription DLQ was configured.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SNS retries every subscription for up to 23 days before giving up.',
      reality: 'That figure applies specifically to AWS-managed endpoints (SQS, Lambda). HTTP/S endpoints default to about a minute of retrying, and even a custom policy cannot exceed 3,600 seconds total.'
    },
    {
      thought: 'You can configure a longer retry window for an HTTP/S subscription if 1 hour is not enough.',
      reality: '3,600 seconds is a documented hard maximum for HTTP/S delivery policies -- it cannot be increased, by request or otherwise.'
    },
    {
      thought: 'Delivery retry behavior can be customized for any SNS subscription type.',
      reality: 'Only HTTP/S subscriptions support a custom delivery policy. SQS, Lambda, email, SMS, and mobile push all use SNS\'s own fixed, non-configurable retry schedule.'
    }
  ];
}
