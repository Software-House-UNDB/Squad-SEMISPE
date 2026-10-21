export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'semispe',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  aurassure: {
    baseUrl:
      process.env.AURASSURE_BASE_URL ??
      'https://app.aurassure.com/-/api/iot-platform/v1.1.0',
    clientId: process.env.AURASSURE_CLIENT_ID ?? '21645',
    applicationId: process.env.AURASSURE_APPLICATION_ID ?? '16',
    accessId: process.env.AURASSURE_ACCESS_ID ?? '',
    accessKey: process.env.AURASSURE_ACCESS_KEY ?? '',
  },
});
