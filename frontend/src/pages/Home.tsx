import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import type { Category, Product } from '../types/api';

const featuredCategories: Category[] = [
  {
    _id: '1',
    name: "Men's Shoes",
    slug: 'mens-shoes',
    description: 'Official, casual, sneakers & slides',
    image: '/images/categories/mens-shoes.jpg',
    isActive: true,
    sortOrder: 1,
    level: 1,
    path: 'mens-shoes',
  },
  {
    _id: '2',
    name: "Women's Shoes",
    slug: 'womens-shoes',
    description: 'Heels, wedges, flats, sneakers & slides',
    image: '/images/categories/womens-shoes.jpg',
    isActive: true,
    sortOrder: 2,
    level: 1,
    path: 'womens-shoes',
  },
  {
    _id: '3',
    name: 'Clothing',
    slug: 'clothing',
    description: "Men's, women's & children's clothing",
    image: '/images/categories/clothing.jpg',
    isActive: true,
    sortOrder: 3,
    level: 1,
    path: 'clothing',
  },
  {
    _id: '4',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Watches, bags & jewelry',
    image: '/images/categories/accessories.jpg',
    isActive: true,
    sortOrder: 4,
    level: 1,
    path: 'accessories',
  },
];

export function Home() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-display font-light tracking-tight text-neutral-900 sm:text-6xl">
              Step into <span className="font-medium">Style</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600">
              Discover premium Kenyan fashion - from handcrafted shoes to contemporary clothing and
              accessories. Quality you can feel, style you can see.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary text-lg px-8 py-3">
                Shop Now
              </Link>
              <Link to="/shop?category=new-arrivals" className="btn-outline text-lg px-8 py-3">
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-display font-light tracking-tight text-neutral-900">
              Shop by Category
            </h2>
            <Link
              to="/shop"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredCategories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center">
                    <svg
                      className="h-16 w-16 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                  <p className="mt-1 text-sm text-neutral-300">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-display font-light tracking-tight text-neutral-900">
              Featured Products
            </h2>
            <Link
              to="/shop"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts?.map((product: Product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Free Delivery</h3>
              <p className="mt-2 text-neutral-600">On orders over KES 5,000</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Secure Payment</h3>
              <p className="mt-2 text-neutral-600">M-Pesa & Card payments</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Easy Returns</h3>
              <p className="mt-2 text-neutral-600">14-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
