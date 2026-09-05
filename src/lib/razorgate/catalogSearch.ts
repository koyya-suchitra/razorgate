import { Product, PurchaseIntent } from './types';

export function searchCatalog(intent: PurchaseIntent, allProducts: Product[]): Product[] {
  return allProducts.map((prod) => {
    let score = 40;
    const factors: string[] = [];

    // 1. Category match
    if (prod.category.toLowerCase() === intent.category.toLowerCase()) {
      score += 25;
      factors.push(`Category matches "${intent.category}"`);
    } else {
      score -= 15;
      factors.push(`Category "${prod.category}" is adjacent to requested "${intent.category}"`);
    }

    // 2. Brand preference
    if (intent.preferredBrand) {
      if (prod.brand.toLowerCase() === intent.preferredBrand.toLowerCase()) {
        score += 20;
        factors.push(`Brand preference matches requested "${intent.preferredBrand}"`);
      } else {
        factors.push(`Alternative brand "${prod.brand}"`);
      }
    }

    // 3. Price & Budget comparison
    const finalAmount = prod.price + prod.shippingCost + prod.taxAmount;
    if (finalAmount <= intent.maxBudget) {
      score += 15;
      factors.push(`Within authorized budget (₹${finalAmount.toLocaleString('en-IN')} <= ₹${intent.maxBudget.toLocaleString('en-IN')})`);
    } else {
      score -= 30;
      factors.push(`EXCEEDS authorized budget (₹${finalAmount.toLocaleString('en-IN')} > ₹${intent.maxBudget.toLocaleString('en-IN')})`);
    }

    // 4. Merchant Verification
    if (prod.merchant.verified) {
      score += 10;
      factors.push(`Merchant verified (${prod.merchant.name}, Trust: ${prod.merchant.trustScore}%)`);
    } else {
      score -= 25;
      factors.push(`WARNING: Merchant "${prod.merchant.name}" is unverified`);
    }

    // 5. Stock availability
    if (prod.stockQuantity > 0) {
      score += 5;
      factors.push(`Product in stock (${prod.stockQuantity} units available)`);
    } else {
      score -= 40;
      factors.push('Out of stock');
    }

    const normalizedScore = Math.max(15, Math.min(99, score));

    // Generate recommendation reason
    let recommendationReason = '';
    if (normalizedScore >= 90) {
      recommendationReason = `Best match because it satisfies the requested brand (${prod.brand}), remains within the authorized budget (₹${finalAmount.toLocaleString('en-IN')} <= ₹${intent.maxBudget.toLocaleString('en-IN')}) and is available from a verified merchant.`;
    } else if (finalAmount > intent.maxBudget) {
      recommendationReason = `Exceeds budget ceiling. Total payable ₹${finalAmount.toLocaleString('en-IN')} exceeds authorized maximum of ₹${intent.maxBudget.toLocaleString('en-IN')}.`;
    } else if (!prod.merchant.verified) {
      recommendationReason = `Not recommended: Merchant is unverified gray market seller with low trust score (${prod.merchant.trustScore}%).`;
    } else {
      recommendationReason = `Alternative selection: ₹${finalAmount.toLocaleString('en-IN')} from ${prod.merchant.name} with ${prod.rating}★ rating.`;
    }

    return {
      ...prod,
      aiMatchScore: normalizedScore,
      decisionFactors: factors,
      recommendationReason,
    };
  }).sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
}
