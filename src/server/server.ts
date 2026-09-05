import http from 'http';
import fs from 'fs';
import path from 'path';
import { handleProductSearchApi } from './searchApiMiddleware.ts';
import { loadServerEnv } from './productSearchService.ts';

loadServerEnv();

const PORT = parseInt(process.env.PORT || '3001', 10);
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';
  const origin = req.headers.origin || 'https://razorgate-demo.web.app';

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health Check for Render & Monitoring
  if (urlPath === '/healthz' || urlPath === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', service: 'razorgate-product-search', timestamp: new Date().toISOString() }));
    return;
  }

  // API Endpoints
  if (urlPath === '/api/products/search' || urlPath === '/api/product-search') {
    handleProductSearchApi(req, res);
    return;
  }

  // Root endpoint info if not serving frontend bundle
  if (urlPath === '/' && !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      service: 'RazorGate Product Search API on Render',
      endpoint: 'POST /api/products/search',
      health: 'GET /healthz'
    }));
    return;
  }

  // Static File Serving (if dist exists)
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', origin);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      service: 'RazorGate Product Search API on Render',
      endpoint: 'POST /api/products/search',
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`RazorGate Render Server listening on 0.0.0.0:${PORT}`);
  console.log(`Search API available at http://0.0.0.0:${PORT}/api/products/search`);
  console.log(`Health check at http://0.0.0.0:${PORT}/healthz`);
});

