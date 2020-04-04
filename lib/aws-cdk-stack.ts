import * as cdk from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import * as IAM from '@aws-cdk/aws-iam';
import * as Codebuild from '@aws-cdk/aws-codebuild';
import {
  CloudFrontWebDistribution,
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
} from '@aws-cdk/aws-cloudfront';
import * as cfg from './config';

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for a static website
    const bucket = new S3.Bucket(this, cfg.BUCKET_NAME, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    /* uncomment this if you do not require cloudfront and comment everything related to cloudfront below */
    // bucket.grantPublicAccess('*', 's3:GetObject');

    // cloudfront distribution for cdn & https
    const cloudFrontOAI = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${cfg.WEBSITE_NAME} website.`,
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
      `${cfg.WEBSITE_NAME}-cfd`,
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
      ).andHeadRefIs(cfg.BUILD_BRANCH),
    ];

    const repo = Codebuild.Source.gitHub({
      owner: cfg.REPO_OWNER,
      repo: cfg.REPO_NAME,
      webhook: true,
      webhookFilters: webhooks,
      reportBuildStatus: true,
    });

    const project = new Codebuild.Project(this, `${cfg.WEBSITE_NAME}-build`, {
      buildSpec: Codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      projectName: `${cfg.WEBSITE_NAME}-build`,
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
    });

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
    // iam policy to invalidate cloudfront's cache
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
  }
}
