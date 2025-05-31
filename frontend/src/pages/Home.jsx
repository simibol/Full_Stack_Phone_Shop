import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/api';
import PhoneCard from '../views/PhoneCard';
import { useSearchParams, Link } from 'react-router-dom';
import { Form, Pagination } from 'react-bootstrap';

const PAGE_SIZE = 16;

export default function Home() {
  const [rawPhones,      setRawPhones]      = useState([]);
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [allBrands,      setAllBrands]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const query       = searchParams.get('query')    || '';
  const brand       = searchParams.get('brand')    || '';
  const maxPriceStr = searchParams.get('maxPrice') || '';
  const maxPrice    = parseFloat(maxPriceStr)      || 0;

  // 1) load rawPhones on query change
  useEffect(() => {
    setLoading(true);
    const params = query ? { query } : {};
    api.get('/phones', { params })
      .then(res => {
        const mapped = res.data
          .filter(p => !p.disabled)
          .map(p => ({
            ...p,
            avgRating: p.reviews.length
              ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
              : 0
          }));
        setRawPhones(mapped);
        setAllBrands(Array.from(new Set(mapped.map(p => p.brand))).sort());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  // 2) filter by brand & price when rawPhones, brand, or maxPriceStr change
  useEffect(() => {
    let tmp = rawPhones;
    if (brand)       tmp = tmp.filter(p => p.brand === brand);
    if (maxPriceStr) tmp = tmp.filter(p => p.price <= maxPrice);
    setFilteredPhones(tmp);
    setPage(1);
  }, [rawPhones, brand, maxPriceStr, maxPrice]);

  if (loading) return <p>Loading home…</p>;

  // 3) if in “search” mode, paginate the filteredPhones
  if (query) {
    const sliderMax = rawPhones.length
      ? Math.ceil(Math.max(...rawPhones.map(p => p.price)))
      : 100;

    const totalPages = Math.max(1, Math.ceil(filteredPhones.length / PAGE_SIZE));
    const paged = filteredPhones.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
      <div style={{ padding: '1rem' }}>
        <h2>Results for “{query}”</h2>

        {/* Brand filter */}
        <Form.Group className="mb-4" controlId="brandSelect">
          <Form.Label>Filter by brand</Form.Label>
          <Form.Select
            value={brand}
            onChange={e => {
              const b = e.target.value;
              const next = {};
              if (query)       next.query    = query;
              if (b)           next.brand    = b;
              if (maxPriceStr) next.maxPrice = maxPriceStr;
              setSearchParams(next);
            }}
          >
            <option value="">All Brands</option>
            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </Form.Select>
        </Form.Group>

        {/* Price slider */}
        <Form.Group className="mb-4" controlId="priceRange">
          <Form.Label>Max Price: ${maxPriceStr || sliderMax}</Form.Label>
          <Form.Range
            min={0}
            max={sliderMax}
            value={maxPriceStr || sliderMax}
            onChange={e => {
              const val = e.target.value;
              const next = {};
              if (query) next.query = query;
              if (brand) next.brand = brand;
              if (parseFloat(val) < sliderMax) next.maxPrice = val;
              setSearchParams(next);
            }}
          />
        </Form.Group>

        {/* Phones grid */}
        {filteredPhones.length === 0
          ? <p>No phones found.</p>
          : (
            <>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {paged.map(p => (
                  <Link
                    key={p._id}
                    to={`/phones/${p._id}`}
                    style={{ textDecoration:'none' }}
                  >
                    <PhoneCard phone={p} showRating />
                  </Link>
                ))}
              </div>

              {/* Pagination controls */}
              <Pagination className="justify-content-center mt-4">
                <Pagination.Prev
                  onClick={() => setPage(n => Math.max(1, n - 1))}
                  disabled={page === 1}
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <Pagination.Item
                    key={n}
                    active={n === page}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setPage(n => Math.min(totalPages, n + 1))}
                  disabled={page === totalPages}
                />
              </Pagination>
            </>
          )
        }
      </div>
    );
  }

  // 4) if no query, show homepage highlights
  const soldOutSoon = rawPhones
    .filter(p => p.stock > 0)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const bestSellers = rawPhones
    .filter(p => p.reviews.length >= 2)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Sold Out Soon</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {soldOutSoon.map(p => (
          <Link
            key={p._id}
            to={`/phones/${p._id}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <PhoneCard phone={p} showRating={false} />
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Best Sellers</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {bestSellers.map(p => (
          <Link
            key={p._id}
            to={`/phones/${p._id}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <PhoneCard phone={p} showRating showPrice={false}/>
          </Link>
        ))}
      </div>
    </div>
  );
}