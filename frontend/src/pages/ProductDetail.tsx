import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import type { Product, Variant } from '../types/api';

function RelatedProductsSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
    return null;
  }
  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <h2 className="text-2xl font-semibold text-neutral-900 mb-8">You May Also Like</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((related) => (
          <ProductCard key={related._id} product={related} />
        ))}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-200 animate-pulse rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-neutral-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-neutral-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-neutral-200 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Product not found</h1>
      <p className="mt-2 text-neutral-600">The product you're looking for doesn't exist.</p>
      <Link to="/shop" className="mt-4 inline-block btn-primary">
        Continue Shopping
      </Link>
    </div>
  );
}

function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug || '');
  const { data: relatedProducts } = useRelatedProducts(product?._id || '', 4);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !product) {
    return <ErrorState />;
  }

  const variants = product.variants || [];
  const activeVariants = variants.filter((v: Variant) => v.status === 'ACTIVE');

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Please select a variant');
      return;
    }
    console.log('Add to cart:', { productId: product._id, variantId: selectedVariant._id, quantity });
    alert(`Added ${quantity} x ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-200 bg-white" aria-label="Breadcrumb">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="text-neutral-500 hover:text-neutral-700">Home</Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li>
              <Link to="/shop" className="text-neutral-500 hover:text-neutral-700">Shop</Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</li>
          </ol>
        </div>
      </nav>

      <main className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-50">
                {product.images.length > 0 ? (
                  product.images.map((image: any, index: number) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt || `${product.name} - view ${index + 1}`}
                      className={`h-full w-full object-cover ${index === 0 ? 'block' : 'hidden'}`}
                    />
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-400">
                    <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 002-2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {product.categoryId && (
                  <Link to={`/shop?category=${product.categoryId}`} className="text-sm text-neutral-500 hover:text-primary-600">
                    {product.categoryId}
                  </Link>
                )}
                {product.brand && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-sm text-neutral-500">{product.brand}</span>
                  </>
                )}
                {product.gender && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-sm capitalize text-neutral-500">{product.gender.toLowerCase()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-display font-light tracking-tight text-neutral-900 sm:text-4xl">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-baseline gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-semibold text-neutral-900">
                      KES {product.basePrice.toLocaleString()}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                      <>
                        <span className="text-xl text-neutral-400 line-through">
                          KES {product.compareAtPrice.toLocaleString()}
                        </span>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                          Save {Math.round((1 - product.basePrice / product.compareAtPrice!) * 100)}%
                        </span>
                      </>
                    )}
                  </div>

                  {product.featured && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                      Featured
                    </span>
                  )}
                </div>

                {product.shortDescription && (
                  <p className="mt-4 text-base text-neutral-600">{product.shortDescription}</p>
                )}

                {product.tags.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.slice(0, 5).map((tag: any) => (
                      <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-6">
                <h2 className="text-lg font-semibold text-neutral-900">Select Variant</h2>

                {activeVariants.length === 0 ? (
                  <p className="mt-4 text-neutral-600">No variants available for this product.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {activeVariants.map((variant: any) => {
                      const isOutOfStock = variant.availableStock <= 0;

                      return (
                        <button
                          key={variant._id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={isOutOfStock}
                          className={`w-full flex items-center justify-between gap-4 rounded-lg border-2 p-4 transition-all ${
                            selectedVariant?._id === variant._id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
{variant.attributes.map((attr: any, i: number) => (
                                 <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                                   {attr.displayName || attr.name}: {attr.value}
                                 </span>
                               ))}
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">SKU: {variant.sku}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-neutral-900">
                              KES {variant.price.toLocaleString()}
                            </span>
                            {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                              <span className="text-sm text-neutral-400 line-through">
                                KES {variant.compareAtPrice.toLocaleString()}
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-neutral-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-l-lg"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={selectedVariant?.availableStock || 99}
                      className="w-16 h-10 text-center border-none focus:outline-none text-neutral-900"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedVariant?.availableStock || 99, quantity + 1))}
                      className="flex h-10 w-10 items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-r-lg"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.availableStock <= 0}
                    className="flex-1 btn-primary text-lg py-3"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden lg:block xl:w-80">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900">Delivery & Returns</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <div>
                        <dt className="font-medium text-neutral-900">Free Delivery</dt>
                        <dd className="text-neutral-600">On orders over KES 5,000</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <dt className="font-medium text-neutral-900">Secure Payment</dt>
                        <dd className="text-neutral-600">M-Pesa & Card</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <dt className="font-medium text-neutral-900">Easy Returns</dt>
                        <dd className="text-neutral-600">14-day return policy</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {product.description && (
                  <div className="prose prose-neutral max-w-none">
                    <h3 className="text-lg font-semibold text-neutral-900">Description</h3>
                    <div className="mt-4 text-neutral-600 whitespace-pre-line">{product.description}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <RelatedProductsSection products={relatedProducts || []} />
        </div>
      </main>
    </div>
  );
}

export default ProductDetail;