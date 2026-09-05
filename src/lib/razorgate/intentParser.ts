import type { PurchaseIntent } from './types.ts';

/**
 * Intelligent client-side NLP intent parser.
 * Extracts bounded commerce parameters deterministically from natural language.
 */
export function parseIntent(rawPrompt: string): PurchaseIntent {
  const clean = rawPrompt.trim();
  const lower = clean.toLowerCase();

  // 0. Detect ambiguous / unclear queries
  const unclearPatterns = [
    /^(something\s+nice|something\s+good|anything|stuff|buy\s+something|show\s+me\s+something|surprise\s+me|cool\s+items?|good\s+products?|random\s+stuff|hello|hi|hey|test)\s*$/i,
    /^(give\s+me\s+something|find\s+me\s+something|show\s+something)\s*$/i,
    /^(something)\s*$/i,
  ];

  const isUnclear = unclearPatterns.some((pattern) => pattern.test(lower));
  if (isUnclear || clean.length < 3) {
    return {
      rawPrompt: clean,
      category: 'General',
      maxBudget: 10000,
      quantity: 1,
      merchantRequirement: 'verified_only',
      paymentAuthorization: 'autonomous_below_budget',
      confidenceScore: 0.1,
      parsedTimestamp: new Date().toISOString(),
      needsClarification: true,
      clarificationReason:
        "Please specify what kind of item you're looking for (e.g., 'bangles under ₹500', 'sneakers under ₹3000', or 'watches between ₹1000 and ₹2000') so RazorGate can find real matching products.",
    };
  }

  // 1. Budget extraction (minPrice and maxPrice)
  let minBudget: number | undefined = undefined;
  let maxBudget = 10000; // Default fallback

  // Check for "between X and Y" or "X to Y"
  const rangeMatch = lower.match(
    /(?:between|from)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*(?:k)?\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*(k)?\b/i
  );

  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    let minVal = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
    let maxVal = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
    if (rangeMatch[3] || lower.includes(`${rangeMatch[2]}k`)) {
      maxVal = maxVal < 1000 ? maxVal * 1000 : maxVal;
    }
    if (lower.includes(`${rangeMatch[1]}k`)) {
      minVal = minVal < 1000 ? minVal * 1000 : minVal;
    }
    if (!isNaN(minVal) && !isNaN(maxVal)) {
      minBudget = Math.min(minVal, maxVal);
      maxBudget = Math.max(minVal, maxVal);
    }
  } else {
    // Check "under / below / max / upto / within / at most / < / for"
    const kMatch = lower.match(
      /(?:under|below|max|upto|within|budget(?:\s+of)?|for|at\s+most|<)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i
    );
    if (kMatch && kMatch[1]) {
      maxBudget = Math.round(parseFloat(kMatch[1]) * 1000);
    } else {
      const budgetMatch = lower.match(
        /(?:under|below|max|upto|within|budget(?:\s+of)?|for|at\s+most|<)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\b/i
      );
      if (budgetMatch && budgetMatch[1]) {
        const parsedNum = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          maxBudget = parsedNum;
        }
      } else {
        // Fallback: search for ₹500, rs 500, etc.
        const directCurrencyMatch = lower.match(
          /(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\b/i
        );
        if (directCurrencyMatch && directCurrencyMatch[1]) {
          const parsedNum = parseInt(directCurrencyMatch[1].replace(/,/g, ''), 10);
          if (!isNaN(parsedNum) && parsedNum > 0) {
            maxBudget = parsedNum;
          }
        }
      }
    }

    // Check min price "above / over / min / from"
    const minMatch = lower.match(
      /(?:above|over|more\s+than|min|minimum|starting(?:\s+from)?|>)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\b/i
    );
    if (minMatch && minMatch[1]) {
      const parsedMin = parseInt(minMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsedMin) && parsedMin > 0 && parsedMin < maxBudget) {
        minBudget = parsedMin;
      }
    }
  }

  // 2. Color extraction
  let color: string | undefined = undefined;
  const knownColors = [
    'black',
    'white',
    'red',
    'blue',
    'green',
    'yellow',
    'gold',
    'silver',
    'pink',
    'purple',
    'orange',
    'brown',
    'grey',
    'gray',
    'rose gold',
    'bronze',
  ];
  for (const c of knownColors) {
    const rx = new RegExp(`\\b${c}\\b`, 'i');
    if (rx.test(lower)) {
      color = c;
      break;
    }
  }

  // 3. Gender extraction
  let gender: string | undefined = undefined;
  if (/\b(women|woman|women's|female|girls?|ladies)\b/i.test(lower)) {
    gender = 'women';
  } else if (/\b(men|man|men's|male|boys?|gentlemen)\b/i.test(lower)) {
    gender = 'men';
  } else if (/\b(unisex)\b/i.test(lower)) {
    gender = 'unisex';
  }

  // 4. Brand extraction
  let preferredBrand: string | undefined = undefined;
  const knownBrands = [
    { name: 'Sony', regex: /\b(sony)\b/i },
    { name: 'Bose', regex: /\b(bose)\b/i },
    { name: 'JBL', regex: /\b(jbl)\b/i },
    { name: 'Apple', regex: /\b(apple|macbook|airpods|ipad|iphone)\b/i },
    { name: 'Nike', regex: /\b(nike)\b/i },
    { name: 'Adidas', regex: /\b(adidas)\b/i },
    { name: 'Puma', regex: /\b(puma)\b/i },
    { name: 'Titan', regex: /\b(titan)\b/i },
    { name: 'Casio', regex: /\b(casio|g-shock|edifice)\b/i },
    { name: 'Fastrack', regex: /\b(fastrack)\b/i },
    { name: 'Fossil', regex: /\b(fossil)\b/i },
    { name: 'Sennheiser', regex: /\b(sennheiser)\b/i },
    { name: 'Samsung', regex: /\b(samsung|galaxy)\b/i },
    { name: 'Boat', regex: /\b(boat)\b/i },
    { name: 'Noise', regex: /\b(noise)\b/i },
    { name: 'Fire-Boltt', regex: /\b(fire-boltt|fireboltt)\b/i },
  ];

  for (const b of knownBrands) {
    if (b.regex.test(lower)) {
      preferredBrand = b.name;
      break;
    }
  }

  // 5. Category & Keywords extraction
  let category = '';
  const keywords: string[] = [];

  if (/\b(bangles?|kada|chooda|chudi|bangle)\b/i.test(lower)) {
    category = 'bangles';
    keywords.push('bangles');
  } else if (/\b(sneakers?|shoes?|footwear|running\s+shoes?|loafers?|sandals?)\b/i.test(lower)) {
    category = 'sneakers';
    keywords.push('sneakers');
  } else if (/\b(watch|watches|smartwatch|smartwatches|timepiece)\b/i.test(lower)) {
    category = 'watches';
    keywords.push('watches');
  } else if (/\b(headphones?|earphones?|earbuds?|airpods|headset|anc|audio)\b/i.test(lower)) {
    category = 'headphones';
    keywords.push('headphones');
  } else if (/\b(handbag|handbags|purse|tote|backpack|wallet|bags?)\b/i.test(lower)) {
    category = 'handbags';
    keywords.push('handbags');
  } else if (/\b(laptops?|macbook|computer|notebook)\b/i.test(lower)) {
    category = 'laptops';
    keywords.push('laptops');
  } else if (/\b(camera|cameras|dslr|lens|rig)\b/i.test(lower)) {
    category = 'cameras';
    keywords.push('cameras');
  } else if (/\b(perfume|fragrance|cologne|scent)\b/i.test(lower)) {
    category = 'perfume';
    keywords.push('perfume');
  } else {
    // Extract main noun phrase from prompt by stripping stop words and budget terms
    const sanitized = lower
      .replace(/(?:i\s+want|find\s+me|find|show\s+me|show|give\s+me|buy|search\s+for|get|looking\s+for|best|option)/g, '')
      .replace(/(?:under|below|max|upto|within|budget(?:\s+of)?|for|at\s+most|between|from|to|and)\s*(?:₹|rs\.?|inr)?\s*[0-9,]+/g, '')
      .replace(/(?:₹|rs\.?|inr)\s*[0-9,]+/g, '')
      .trim();

    const words = sanitized.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      category = words.join(' ');
      keywords.push(...words);
    } else {
      category = 'Products';
    }
  }

  // 6. Quantity extraction
  let quantity = 1;
  const qtyMatch = lower.match(/\b(\d+)\s*(?:units?|pieces?|pairs?|items?|qty|bangles?|bags?|shoes?|watches?|headphones?)\b/i);
  if (qtyMatch && qtyMatch[1]) {
    const q = parseInt(qtyMatch[1], 10);
    if (!isNaN(q) && q > 0 && q <= 100) {
      quantity = q;
    }
  }

  // 7. Merchant Requirement
  const merchantRequirement: 'verified_only' | 'any' =
    lower.includes('unverified') || lower.includes('any merchant')
      ? 'any'
      : 'verified_only';

  // 8. Payment Authorization Mode
  let paymentAuthorization: 'autonomous_below_budget' | 'always_require_approval' | 'strict_budget' =
    'autonomous_below_budget';

  if (lower.includes('require approval') || lower.includes('ask me first') || maxBudget > 25000) {
    paymentAuthorization = 'always_require_approval';
  } else if (lower.includes('strict') || lower.includes('exact')) {
    paymentAuthorization = 'strict_budget';
  }

  // Target Specs
  const targetSpecs: string[] = [];
  if (lower.includes('noise cancel') || lower.includes('anc')) targetSpecs.push('Active Noise Cancellation');
  if (lower.includes('wireless') || lower.includes('bluetooth')) targetSpecs.push('Wireless / Bluetooth');
  if (lower.includes('battery') || lower.includes('long')) targetSpecs.push('Extended Battery');
  if (lower.includes('running') || lower.includes('sports')) targetSpecs.push('Ergonomic Sports Grip');
  if (lower.includes('waterproof') || lower.includes('water resistant')) targetSpecs.push('Water Resistant');
  if (lower.includes('leather')) targetSpecs.push('Genuine Leather');
  if (lower.includes('silver') || lower.includes('oxidized')) targetSpecs.push('Silver / Oxidized Finish');
  if (color) targetSpecs.push(`Color: ${color}`);
  if (gender) targetSpecs.push(`Gender: ${gender}`);

  return {
    rawPrompt: clean,
    category,
    maxBudget,
    minBudget,
    preferredBrand,
    quantity,
    merchantRequirement,
    paymentAuthorization,
    confidenceScore: 0.98,
    parsedTimestamp: new Date().toISOString(),
    targetSpecs: targetSpecs.length > 0 ? targetSpecs : undefined,
    color,
    gender,
    keywords,
    needsClarification: false,
  };
}

/**
 * Converts parsed intent into a structured shopping search request
 */
export function buildShoppingSearchQuery(intent: PurchaseIntent) {
  const parts: string[] = [];

  if (intent.color) parts.push(intent.color);
  if (intent.preferredBrand) parts.push(intent.preferredBrand);
  if (intent.gender && intent.category !== 'bangles') parts.push(intent.gender);
  if (intent.category) parts.push(intent.category);

  // If query parts are empty, use words from rawPrompt
  let queryStr = parts.join(' ').trim();
  if (!queryStr) {
    queryStr = intent.rawPrompt
      .replace(/(?:under|below|between|from|to|and|inr|rs|₹|\d+)/gi, '')
      .trim();
  }

  return {
    query: queryStr,
    maxPrice: intent.maxBudget,
    minPrice: intent.minBudget,
    category: intent.category,
    country: 'IN',
    currency: 'INR',
    limit: 15,
    color: intent.color,
    gender: intent.gender,
    brand: intent.preferredBrand,
  };
}
