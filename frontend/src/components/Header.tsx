import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAutocomplete } from '../hooks/useProducts';
import type { AutocompleteSuggestion } from '../types/api';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: autocompleteData } = useAutocomplete(searchQuery, 5);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const suggestions: AutocompleteSuggestion[] = autocompleteData?.suggestions || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-display font-semibold tracking-tight text-neutral-900"
            >
              Happy Feet
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/shop"
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/shop"
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
              >
                New Arrivals
              </Link>
              <Link
                to="/shop"
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
              >
                Sale
              </Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <form onSubmit={handleSearch} className="relative">
              <label htmlFor="search" className="sr-only">
                Search products
              </label>
              <input
                id="search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search shoes, clothing, accessories..."
                className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-neutral-200 bg-white shadow-lg overflow-hidden">
                {suggestions.map((suggestion: AutocompleteSuggestion, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (suggestion.type === 'product' && suggestion.slug) {
                        navigate(`/product/${suggestion.slug}`);
                      } else if (suggestion.type === 'category' && suggestion.slug) {
                        navigate(`/shop?category=${suggestion.slug}`);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
                  >
                    {suggestion.image && (
                      <img
                        src={suggestion.image}
                        alt=""
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                    <span className="text-sm font-medium text-neutral-900">{suggestion.text}</span>
                    <span className="ml-auto text-xs text-neutral-500 capitalize">
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600"
            >
              Sign in
            </Link>
            <Link to="/cart" className="relative text-neutral-700 hover:text-primary-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-xs text-white flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
