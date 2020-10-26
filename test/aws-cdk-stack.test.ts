import { config } from 'dotenv';
config();
import { envVars } from '../lib/config';
import * as cdk from '@aws-cdk/core';
import * as Codebuild from '@aws-cdk/aws-codebuild';
import {
  haveResourceLike,
  expect as expectCDK,
  haveOutput,
} from '@aws-cdk/assert';
import { AwsCdkStack } from '../lib/aws-cdk-stack';

test('stack has resource of an S3 bucket', () => {
  const stack = createStack();

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
  const stack = createStack();

  expectCDK(stack).to(haveResourceLike('AWS::CloudFront::Distribution'));
  expectCDK(stack).to(
    haveResourceLike('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
      CloudFrontOriginAccessIdentityConfig: {
        Comment: `OAI for ${envVars.WEBSITE_NAME} website.`,
      },
    })
  );
});

test('creates a Codebuild project', () => {
  const stack = createStack();
  expectCDK(stack).to(
    haveResourceLike('AWS::CodeBuild::Project', {
      Artifacts: {
        Type: 'NO_ARTIFACTS',
      },
      Environment: {
        ComputeType: Codebuild.ComputeType.SMALL,
        PrivilegedMode: false,
      },
      Name: `${envVars.WEBSITE_NAME}-build`,
      TimeoutInMinutes: 20,
      Triggers: {
        FilterGroups: [
          [
            {
              Pattern: 'PUSH, PULL_REQUEST_MERGED',
              Type: 'EVENT',
            },
            {
              Pattern: envVars.BUILD_BRANCH,
              Type: 'HEAD_REF',
            },
          ],
        ],
        Webhook: true,
      },
    })
  );
});

test('stack has an output of the Cloudfront distribution URL', () => {
  const stack = createStack();

  expectCDK(stack).to(
    haveOutput({
      exportName: 'Cloudfront-URL',
      outputName: 'cloudfronturl',
    })
  );
});

function createStack() {
  const stackName = 'SPA-deploy';
  const app = new cdk.App();
  return new AwsCdkStack(app, stackName);
}
