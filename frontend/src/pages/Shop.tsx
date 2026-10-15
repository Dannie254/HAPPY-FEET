import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useCategoryTree } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import type { SearchParams, Category, Product } from '../types/api';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'name_desc', label: 'Name: Z-A' },
];

const GENDER_OPTIONS: { value: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS'; label: string }[] = [
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'KIDS', label: 'Kids' },
];

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const sort = searchParams.get('sort') as SearchParams['sort'] || 'relevance';
  const categoryId = searchParams.get('categoryId') || undefined;
  const subcategoryId = searchParams.get('subcategoryId') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const gender = searchParams.get('gender') as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | undefined;
  const minPrice = searchParams.get('minPrice')
    ? parseFloat(searchParams.get('minPrice')!)
    : undefined;
  const maxPrice = searchParams.get('maxPrice')
    ? parseFloat(searchParams.get('maxPrice')!)
    : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const q = searchParams.get('q') || undefined;

  const searchParamsObj: SearchParams = {
    q,
    categoryId,
    subcategoryId,
    brand,
    gender: gender as any,
    minPrice,
    maxPrice,
    inStock: inStock || undefined,
    featured: featured || undefined,
    page,
    limit,
    sort: sort as any,
  };

  const { data: productsData, isLoading, isError } = useProducts(searchParamsObj);
  const { data: categoryTree } = useCategoryTree();

  const updateFilters = (newParams: Partial<SearchParams>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = !!(
    categoryId ||
    subcategoryId ||
    brand ||
    gender ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStock ||
    featured
  );

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600">Failed to load products. Please try again.</p>
      </div>
    );
  }

  const products = productsData?.data || [];
  const total = productsData?.meta?.total || 0;
  const totalPages = productsData?.meta?.totalPages || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {q ? `Search results for "${q}"` : categoryId ? 'Shop' : 'All Products'}
            <span className="ml-2 text-sm font-normal text-neutral-500">({total} items)</span>
          </h1>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-72 border-r border-neutral-200 bg-neutral-50 p-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Categories
            </h2>
            <div className="space-y-2">
              {categoryTree?.map((cat: { _id: string; name: string; children?: Category[] }) => (
                <details key={cat._id} className="group">
                  <summary
                    className={`flex items-center justify-between text-sm ${categoryId === cat._id ? 'text-primary-600 font-medium' : 'text-neutral-700'} hover:text-primary-600 cursor-pointer`}
                  >
                    {cat.name}
                    <svg
                      className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  {cat.children && (
                    <ul className="mt-2 ml-4 space-y-1 border-l pl-3">
                      {cat.children.map((child: { _id: string; name: string }) => (
                        <li key={child._id}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value={child._id}
                              checked={categoryId === child._id}
                              onChange={() =>
                                updateFilters({ categoryId: child._id, subcategoryId: undefined })
                              }
                              className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-700">{child.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Gender
            </h2>
            <div className="space-y-2">
              {GENDER_OPTIONS.map((g) => (
                <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g.value}
                    checked={gender === g.value}
                    onChange={() => updateFilters({ gender: g.value })}
                    className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Price Range
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Math.max(0, parseInt(e.target.value) || 0), priceRange[1]])
                  }
                  className="flex-1 input text-sm"
                  placeholder="Min"
                />
                <span className="text-neutral-500">-</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  max="100000"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      Math.max(priceRange[0], parseInt(e.target.value) || 50000),
                    ])
                  }
                  className="flex-1 input text-sm"
                  placeholder="Max"
                />
              </div>
              <button
                onClick={() =>
                  updateFilters({
                    minPrice: priceRange[0] || undefined,
                    maxPrice: priceRange[1] === 50000 ? undefined : priceRange[1],
                  })
                }
                className="w-full btn-secondary text-sm"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Availability
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateFilters({ inStock: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">In Stock Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateFilters({ featured: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Featured Only</span>
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as SearchParams['sort'] })}
                  className="input text-sm max-w-xs"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="text-sm text-neutral-500">
                Showing {products.length} of {productsData?.meta?.total || 0} products
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-square bg-neutral-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2" />
                    <div className="h-5 bg-neutral-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.707l-2.414 2.414a1 1 0 01-.707.707l-2.414 2.414a1 1 0 01-.707.707L3 21"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-neutral-900">No products found</h3>
              <p className="mt-2 text-neutral-600">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="mt-4 btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product: Product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-6">
                  <button
                    onClick={() => updateFilters({ page: page - 1 })}
                    disabled={page === 1}
                    className="btn-outline text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updateFilters({ page: pageNum })}
                          className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => updateFilters({ page: page + 1 })}
                    disabled={page === totalPages}
                    className="btn-outline text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

