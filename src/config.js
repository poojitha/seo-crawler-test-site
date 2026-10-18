// Central configuration. Override with environment variables, e.g. PORT=8080 npm start
const PORT = Number(process.env.PORT) || 3000;
// Primary hostname the crawler should start on.
const HOST = process.env.HOST || 'localhost';
// A second hostname that resolves to the same machine. It plays the role of
// "another domain": external links, the m-dot mobile site and cross-host canonicals.
const ALT_HOST = process.env.ALT_HOST || '127.0.0.1';

module.exports = {
  PORT,
  HOST,
  ALT_HOST,
  ORIGIN: `http://${HOST}:${PORT}`,
  ALT_ORIGIN: `http://${ALT_HOST}:${PORT}`,
  STARTED: Date.now(),
};
