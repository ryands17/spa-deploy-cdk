# SPA Deploy Codebuild

This is an [aws-cdk](https://aws.amazon.com/cdk/) project where you can deploy any SPA (React, Angular, Vue, etc.) via Codebuild on S3 and served via Cloudfront.

**_Note_**: This configuration is for GitHub only. For Bitbucket, you can edit the source accordingly.

**Prerequisites**

- Setup your access and secret keys via the [aws-cli](https://aws.amazon.com/cli/) and with the profile name of your choice (the default profile is named `default`). The credentials generated should have access to creation of all resources mentioned else it won't work.

**Steps**

1. Rename the `.example.env` file to `.env` and replace all the values with your predefined values for your stack

2. Run `npm install`

3. Run `npm run deploy -- --profile profileName` to deploy the stack to your specified region. You can skip providing the profile parameter if the profile name is `default`.

4. You can start the build from the console in `Codebuild` and view your website on the Cloudfront provided URL!

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Commands

- `npm run build` compile typescript to js
- `npm run deploy` deploy this stack to your AWS account/region specified in the `.env`
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
