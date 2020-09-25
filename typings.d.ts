declare namespace NodeJS {
  export interface ProcessEnv {
    REGION?: string;
    WEBSITE_NAME: string;
    BUCKET_NAME: string;
    REPO_OWNER: string;
    REPO_NAME: string;
  }
}
