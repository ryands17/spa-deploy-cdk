#!/usr/bin/env node
import { config } from 'dotenv';
config();
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkStack } from '../lib/aws-cdk-stack';
import { envVars, validateEnvVariables } from '../lib/config';

validateEnvVariables();
const app = new cdk.App();
new AwsCdkStack(app, 'SPA-deploy', {
  env: {
    region: envVars.REGION,
  },
});
