export const envVars = {
  REGION: process.env.REGION || 'us-east-1',
  WEBSITE_NAME: process.env.WEBSITE_NAME,
  BUCKET_NAME: process.env.BUCKET_NAME,
  REPO_OWNER: process.env.REPO_OWNER,
  REPO_NAME: process.env.REPO_NAME,
  // you can change this to the branch of your choice (currently main)
  BUILD_BRANCH: process.env.BUILD_BRANCH || '^refs/heads/main$',
};

export function validateEnvVariables() {
  for (let variable in envVars) {
    if (!envVars[variable as keyof typeof envVars])
      throw Error(`Environment variable ${variable} is not defined!`);
  }
}
