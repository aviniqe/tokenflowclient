const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.REACT_APP_API_URL || 'http://localhost:5000';

module.exports = function setupProxy(app) {
  app.use(
    '/api/v1',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
  app.use(
    '/health',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
