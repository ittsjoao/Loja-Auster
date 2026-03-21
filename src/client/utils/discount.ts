export function hasValidDiscount(product: {
  discount?: { percentOff: number; endDate: string };
}): boolean {
  if (!product.discount?.percentOff || !product.discount?.endDate) return false;
  return new Date(product.discount.endDate) > new Date();
}

export function getDiscountedPrice(product: {
  price: number;
  discount?: { percentOff: number; endDate: string };
}): number {
  if (!hasValidDiscount(product)) return product.price;
  return Math.round(product.price * (1 - product.discount!.percentOff / 100));
}

export function getDiscountTimeRemaining(endDate: string): string | null {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h restantes`;
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  if (minutes > 0) return `${minutes}m restantes`;
  return null;
}
