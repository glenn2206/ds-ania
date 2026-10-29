interface ProductVisibility {
  category: string;
  name: string;
  slug: string;
}

export function isCustomerVisibleProduct(product: ProductVisibility): boolean {
  if (product.category !== 'accessory') return true;
  const identity = `${product.name} ${product.slug}`.toLowerCase().replace(/[-_]+/g, ' ');
  return !/\b(scissors?|secateurs?|gunting)\b|\b(?:plant?|flower) clipper holder\b|\bglass flower dome\b/.test(identity);
}
