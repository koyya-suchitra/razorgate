import { Product, PurchaseIntent } from '../razorgate/types';
import { buildShoppingSearchQuery } from '../razorgate/intentParser';

export interface SearchProductsResult {
  success: boolean;
  products: Product[];
  count: number;
  error?: string;
  code?: string;
  message?: string;
  source: string;
  searchVariationsUsed?: string[];
}

/**
 * Client-side interface to call the backend shopping discovery service.
 * Never makes direct calls to SerpApi from the browser.
 */
export async function searchShoppingCatalog(
  intent: PurchaseIntent
): Promise<SearchProductsResult> {
  const queryPayload = buildShoppingSearchQuery(intent);

  const apiBase = (
    import.meta.env.VITE_RENDER_API_URL ||
    import.meta.env.VITE_API_URL ||
    'https://razorgate-product-search.onrender.com'
  ).replace(/\/$/, '');
  const endpoint = `${apiBase}/api/products/search`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...queryPayload,
        rawPrompt: intent.rawPrompt,
      }),
    });

    const contentType = response.headers.get('content-type') || '';

    // If server returned HTML (e.g. static index.html or 404 page)
    if (!contentType.includes('application/json')) {
      const textSnippet = (await response.text().catch(() => '')).substring(0, 150);
      console.error('[ProductSearchClient] Expected JSON but received:', response.status, contentType, textSnippet);
      return {
        success: false,
        products: [],
        count: 0,
        error: `Production backend endpoint returned HTTP ${response.status} (${contentType.split(';')[0]}). The Render backend is not reachable.`,
        code: 'BACKEND_NOT_REACHABLE',
        source: 'Google Shopping',
      };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.success) {
      return {
        success: false,
        products: [],
        count: 0,
        error:
          data?.error ||
          (response.status === 503
            ? 'Real product search is temporarily unavailable. Please check the shopping search API configuration.'
            : `Search failed with status ${response.status}.`),
        code: data?.code || 'SERVER_ERROR',
        source: 'Google Shopping',
      };
    }

    return {
      success: true,
      products: data.products || [],
      count: data.count || data.products?.length || 0,
      source: data.source || 'Google Shopping',
      message: data.message,
      searchVariationsUsed: data.searchVariationsUsed,
    };
  } catch (err: any) {
    console.error('[ProductSearchClient] Network failure:', err);
    return {
      success: false,
      products: [],
      count: 0,
      error:
        'Real product search is temporarily unavailable. Please check the shopping search API configuration or backend server.',
      code: 'NETWORK_ERROR',
      source: 'Google Shopping',
    };
  }
}
