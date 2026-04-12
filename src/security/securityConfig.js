// Frontend security configuration.
// In production, sensitive values live in environment variables.

export const securityConfig = {
  enforceHttps: true,
  contentSecurityPolicy: "default-src 'self'; img-src 'self' data:;",
  allowedOrigins: ["https://judgetracker.info", "http://localhost:3000"],
};
