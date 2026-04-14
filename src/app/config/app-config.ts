export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ApplicationConfig {
  app: {
    name: string;
    nodeEnv: NodeEnvironment;
    port: number;
    globalPrefix: string;
    swaggerEnabled: boolean;
    corsAllowedOrigins: string[];
  };
  database: {
    url: string;
  };
  auth: {
    jwtIssuer: string;
    accessTokenSecret: string;
    accessTokenTtl: string;
    refreshTokenSecret: string;
    refreshTokenTtl: string;
    rateLimitMaxRequests: number;
    rateLimitWindowSeconds: number;
  };
}
