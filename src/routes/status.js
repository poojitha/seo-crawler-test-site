// /status_codes/* – one URL per HTTP status code, plus connection-level failures.

const { group } = require('../registry');
const { render } = require('../html');

const t = group('status_codes');

const REASONS = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 203: 'Non-Authoritative Information', 204: 'No Content',
  205: 'Reset Content', 206: 'Partial Content', 207: 'Multi-Status', 208: 'Already Reported', 226: 'IM Used',
  300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified',
  305: 'Use Proxy', 306: 'Switch Proxy', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
  400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden', 404: 'Not Found',
  405: 'Method Not Allowed', 406: 'Not Acceptable', 407: 'Proxy Authentication Required', 408: 'Request Timeout',
  409: 'Conflict', 410: 'Gone', 411: 'Length Required', 412: 'Precondition Failed', 413: 'Payload Too Large',
  414: 'URI Too Long', 415: 'Unsupported Media Type', 416: 'Range Not Satisfiable', 417: 'Expectation Failed',
  418: "I'm a teapot", 419: 'Page Expired', 420: 'Enhance Your Calm', 421: 'Misdirected Request',
  422: 'Unprocessable Entity', 423: 'Locked', 424: 'Failed Dependency', 425: 'Too Early', 426: 'Upgrade Required',
  428: 'Precondition Required', 429: 'Too Many Requests', 431: 'Request Header Fields Too Large',
  440: 'Login Time-out', 444: 'No Response', 449: 'Retry With', 450: 'Blocked by Windows Parental Controls',
  451: 'Unavailable For Legal Reasons', 494: 'Request Header Too Large', 495: 'SSL Certificate Error',
  496: 'SSL Certificate Required', 497: 'HTTP Request Sent to HTTPS Port', 498: 'Invalid Token',
  499: 'Client Closed Request', 500: 'Internal Server Error', 501: 'Not Implemented', 502: 'Bad Gateway',
  503: 'Service Unavailable', 504: 'Gateway Timeout', 505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates', 507: 'Insufficient Storage', 508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded', 510: 'Not Extended', 511: 'Network Authentication Required',
  520: 'Web Server Returned an Unknown Error', 521: 'Web Server Is Down', 522: 'Connection Timed Out',
  523: 'Origin Is Unreachable', 524: 'A Timeout Occurred', 525: 'SSL Handshake Failed', 526: 'Invalid SSL Certificate',
  530: 'Site Frozen', 598: 'Network Read Timeout Error', 599: 'Network Connect Timeout Error',
};
const REDIRECTING = new Set([300, 301, 302, 303, 305, 306, 307, 308]);

function expectFor(c) {
  if (c === 200) return 'Success (2xx), indexable.';
  if (c < 300) return `Success (2xx) but non-200: reported as status ${c}; ${c === 204 ? 'empty body' : 'treat with care'}.`;
  if (c === 304) return 'Not Modified with no Location and no body – reported as 3xx without a redirect target.';
  if (c < 400) return `Redirection (3xx) to /redirects/redirect_target; non-indexable.`;
  if (c < 500) return `Client Error (4xx); non-indexable, flagged as broken if linked.`;
  return 'Server Error (5xx); non-indexable.';
}

for (const [code, reason] of Object.entries(REASONS)) {
  const c = Number(code);
  t(`/status_codes/status_${c}`, `Status ${c} ${reason}`, `Server answers with HTTP ${c} ${reason}.`, expectFor(c), {}, {
    handler: () => {
      const headers = {};
      if (REDIRECTING.has(c)) headers.Location = '/redirects/redirect_target';
      if (c === 401) headers['WWW-Authenticate'] = 'Basic realm="crawler-test"';
      if (c === 405) headers.Allow = 'POST';
      if (c === 429 || c === 503) headers['Retry-After'] = '120';
      if (c === 206) headers['Content-Range'] = 'bytes 0-99/1000';
      const page = render({ status: c, reason, headers, title: c === 200 ? 'Status 200 OK' : null, description: null, h1: `${c} ${reason}`, filler: false, chrome: false });
      return { ...page, reason };
    },
  });
}

t('/status_codes/no_response', 'No response (connection closed)', 'Server accepts the connection then closes it without sending anything.', 'Status code 0 / "No Response" / connection error.', {}, {
  handler: (ctx) => {
    ctx.req.socket.destroy();
  },
});

t('/status_codes/connection_reset_mid_body', 'Connection reset mid-body', 'Server promises 5000 bytes, sends 200, then drops the connection.', 'Truncated response / connection error.', {}, {
  handler: (ctx) => {
    ctx.res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': 5000 });
    ctx.res.write('<!DOCTYPE html><html><head><title>Truncated</title></head><body><p>This response is cut off');
    setTimeout(() => ctx.req.socket.destroy(), 200);
  },
});

t('/status_codes/timeout', 'Request timeout (65 s)', 'Server waits 65 seconds before responding – longer than most crawler timeouts (Screaming Frog default: 20 s).', 'Status 0 / "Connection Timeout".', {}, {
  handler: () => new Promise((resolve) => setTimeout(() => resolve(render({ title: 'Finally responded after 65 seconds' })), 65000)),
});

t('/status_codes/slow_5s', 'Slow response (5 s)', 'Server waits 5 seconds before answering 200.', '200 with a high response time.', {}, {
  handler: () => new Promise((resolve) => setTimeout(() => resolve(render({ title: 'Slow Response 5 Seconds', path: '/status_codes/slow_5s' })), 5000)),
});

t('/status_codes/empty_200', 'Empty 200 response', '200 OK with Content-Length: 0.', '200 with no title, no content (0 bytes).', {}, {
  handler: () => ({ status: 200, body: '' }),
});

t('/status_codes/custom_reason_phrase', 'Non-standard reason phrase', 'HTTP/1.1 200 Everything Is Fine – reason phrase differs from "OK".', '200 (status text may show the custom phrase).', {}, {
  handler: () => ({ ...render({ title: 'Custom Reason Phrase', path: '/status_codes/custom_reason_phrase' }), reason: 'Everything Is Fine' }),
});
