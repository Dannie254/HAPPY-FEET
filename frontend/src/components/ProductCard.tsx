import { Link } from 'react-router-dom';
import type { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.basePrice / product.compareAtPrice!) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <Link to={`/product/${product.slug}`} className="flex gap-3 group">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
          {primaryImage && (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-primary-600 font-medium">
            KES {product.basePrice.toLocaleString()}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <article className="card overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
              Featured
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">
            {product.categoryId}
          </p>
          <h3 className="mt-1 text-base font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-semibold text-neutral-900">
              KES {product.basePrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-neutral-400 line-through">
                KES {product.compareAtPrice!.toLocaleString()}
              </span>
            )}
          </div>
          {product.variantsCount && product.variantsCount > 1 && (
            <p className="mt-2 text-xs text-neutral-500">
              {product.variantsCount} variants available
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
