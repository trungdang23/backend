export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ApplicationConfig {
  app: {
    name: string;
    nodeEnv: NodeEnvironment;
    port: number;
    globalPrefix: string;
    swaggerEnabled: boolean;
  };
  database: {
    url: string;
  };
  auth: {
    jwtIssuer: string;
    accessTokenTtl: string;
    refreshTokenTtl: string;
  };
}
