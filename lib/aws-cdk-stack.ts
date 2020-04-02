import * as cdk from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import { BUCKET_NAME } from './config';

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create an S3 bucket
    const bucket = new S3.Bucket(this, BUCKET_NAME, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });
    bucket.grantPublicAccess('*', 's3:GetObject');
  }
}
