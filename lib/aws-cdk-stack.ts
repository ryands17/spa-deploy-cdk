import * as cdk from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import * as IAM from '@aws-cdk/aws-iam';
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
} from '@aws-cdk/aws-cloudfront';
import { BUCKET_NAME, WEBSITE_NAME } from './config';

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for a static website
    const bucket = new S3.Bucket(this, BUCKET_NAME, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });
    // bucket.grantPublicAccess('*', 's3:GetObject');

    // cloudfront dist for cdn & https
    const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${WEBSITE_NAME} website.`,
    });

    let cloudFrontDistProps: CloudFrontWebDistributionProps = {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
          originPath: `/`,
        },
      ],
    };

    new CloudFrontWebDistribution(
      this,
      `${WEBSITE_NAME}-cfn`,
      cloudFrontDistProps
    );

    // add IAM roles for Cloudfront only access to S3
    const policyStatement = new IAM.PolicyStatement();
    policyStatement.addActions('s3:GetBucket*');
    policyStatement.addActions('s3:GetObject*');
    policyStatement.addActions('s3:List*');
    policyStatement.addResources(bucket.bucketArn);
    policyStatement.addResources(`${bucket.bucketArn}/*`);
    policyStatement.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    bucket.addToResourcePolicy(policyStatement);
  }
}
