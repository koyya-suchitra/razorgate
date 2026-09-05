import type { IncomingMessage, ServerResponse } from 'http';
import { searchProducts, type ProductSearchParams } from './productSearchService.ts';

/**
 * Connect middleware for POST /api/products/search
 */
export function handleProductSearchApi(req: IncomingMessage, res: ServerResponse, next?: () => void) {
  // Check path
  const url = req.url?.split('?')[0];
  if (url !== '/api/products/search' && url !== '/api/product-search') {
    if (next) return next();
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.end();
    return;
  }

  // Only handle POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
    if (body.length > 1e6) {
      // 1MB flood protection
      res.statusCode = 413;
      res.end('Payload Too Large');
      req.destroy();
    }
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    try {
      const data = JSON.parse(body || '{}');

      if (!data.query || typeof data.query !== 'string' || !data.query.trim()) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            success: false,
            error: 'Missing required field: "query"',
            code: 'INVALID_QUERY',
          })
        );
        return;
      }

      const maxPrice = typeof data.maxPrice === 'number' ? data.maxPrice : parseFloat(data.maxPrice) || 10000;
      const minPrice = typeof data.minPrice === 'number' ? data.minPrice : data.minPrice ? parseFloat(data.minPrice) : undefined;

      const params: ProductSearchParams = {
        query: data.query.trim(),
        maxPrice,
        minPrice,
        category: data.category,
        country: data.country || 'in',
        currency: data.currency || 'INR',
        limit: typeof data.limit === 'number' ? data.limit : 15,
        color: data.color,
        gender: data.gender,
        brand: data.brand,
        rawPrompt: data.rawPrompt,
      };

      const result = await searchProducts(params);

      res.statusCode = result.success ? 200 : result.code === 'MISSING_API_KEY' ? 503 : 500;
      res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error('[SearchApiMiddleware] Request parse error:', err);
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON request body.',
          code: 'MALFORMED_REQUEST',
        })
      );
    }
  });
}
