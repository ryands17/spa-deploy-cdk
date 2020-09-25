import * as cdk from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import * as IAM from '@aws-cdk/aws-iam';
import * as Codebuild from '@aws-cdk/aws-codebuild';
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
} from '@aws-cdk/aws-cloudfront';
import { envVars } from './config';

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for a static website
    const bucket = new S3.Bucket(this, envVars.BUCKET_NAME, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    /* uncomment this if you do not require cloudfront and comment everything related to cloudfront below */
    // bucket.grantPublicAccess('*', 's3:GetObject');

    // cloudfront distribution for cdn & https
    const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${envVars.WEBSITE_NAME} website.`,
    });

    const cloudFrontDistProps: CloudFrontWebDistributionProps = {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    };

    const cloudfrontDist = new CloudFrontWebDistribution(
      this,
      `${envVars.WEBSITE_NAME}-cfd`,
      cloudFrontDistProps
    );

    // add IAM roles for Cloudfront only access to S3
    const cloudfrontS3Access = new IAM.PolicyStatement();
    cloudfrontS3Access.addActions('s3:GetBucket*');
    cloudfrontS3Access.addActions('s3:GetObject*');
    cloudfrontS3Access.addActions('s3:List*');
    cloudfrontS3Access.addResources(bucket.bucketArn);
    cloudfrontS3Access.addResources(`${bucket.bucketArn}/*`);
    cloudfrontS3Access.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    bucket.addToResourcePolicy(cloudfrontS3Access);

    // codebuild project setup
    const webhooks: Codebuild.FilterGroup[] = [
      Codebuild.FilterGroup.inEventOf(
        Codebuild.EventAction.PUSH,
        Codebuild.EventAction.PULL_REQUEST_MERGED
      ).andHeadRefIs(envVars.BUILD_BRANCH),
    ];

    const repo = Codebuild.Source.gitHub({
      owner: envVars.REPO_OWNER,
      repo: envVars.REPO_NAME,
      webhook: true,
      webhookFilters: webhooks,
      reportBuildStatus: true,
    });

    const project = new Codebuild.Project(
      this,
      `${envVars.WEBSITE_NAME}-build`,
      {
        buildSpec: Codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
        projectName: `${envVars.WEBSITE_NAME}-build`,
        environment: {
          buildImage: Codebuild.LinuxBuildImage.STANDARD_3_0,
          computeType: Codebuild.ComputeType.SMALL,
          environmentVariables: {
            S3_BUCKET: {
              value: bucket.bucketName,
            },
            CLOUDFRONT_DIST_ID: {
              value: cloudfrontDist.distributionId,
            },
          },
        },
        source: repo,
        timeout: cdk.Duration.minutes(20),
      }
    );

    // iam policy to push your build to S3
    project.addToRolePolicy(
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        actions: [
          's3:GetBucket*',
          's3:List*',
          's3:GetObject*',
          's3:DeleteObject',
          's3:PutObject',
        ],
      })
    );
    // iam policy to invalidate cloudfront distribution's cache
    project.addToRolePolicy(
      new IAM.PolicyStatement({
        effect: IAM.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetDistribution*',
          'cloudfront:GetInvalidation',
          'cloudfront:ListInvalidations',
          'cloudfront:ListDistributions',
        ],
      })
    );

    new cdk.CfnOutput(this, 'cloudfront-url', {
      exportName: 'Cloudfront-URL',
      value: cloudfrontDist.distributionDomainName,
    });
  }
}
