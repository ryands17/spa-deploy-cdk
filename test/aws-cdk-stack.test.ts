import { config } from 'dotenv';
config();
import * as cfg from '../lib/config';
import * as cdk from '@aws-cdk/core';
import {
  SynthUtils,
  haveResourceLike,
  expect as expectCDK,
} from '@aws-cdk/assert';
import { AwsCdkStack } from '../lib/aws-cdk-stack';

const stackName = 'SPA-deploy';

test('snapshot works correctly', () => {
  const app = new cdk.App();
  const stack = new AwsCdkStack(app, stackName);
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('stack has resource of an S3 bucket', () => {
  const app = new cdk.App();
  const stack = new AwsCdkStack(app, stackName);
  expectCDK(stack).to(
    haveResourceLike('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
      },
    })
  );
});

test('stack has resource of Cloudfront dist and Origin Access Identity', () => {
  const app = new cdk.App();
  const stack = new AwsCdkStack(app, stackName);

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution'));
  expectCDK(stack).to(
    haveResourceLike('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
      CloudFrontOriginAccessIdentityConfig: {
        Comment: `OAI for ${cfg.WEBSITE_NAME} website.`,
      },
    })
  );
});
