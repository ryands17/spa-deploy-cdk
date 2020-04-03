#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkStack } from '../lib/aws-cdk-stack';
import { REGION } from '../lib/config';

const app = new cdk.App();
new AwsCdkStack(app, 'SPA-deploy', {
  env: {
    region: REGION,
  },
});
