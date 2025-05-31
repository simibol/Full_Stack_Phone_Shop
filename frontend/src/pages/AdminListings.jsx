import React, { useEffect, useState, useContext, useMemo } from 'react'
import adminApi from '../api/adminApi'
import {
  Container,
  Table,
  FormControl,
  Button,
  InputGroup,
  Form,
  Pagination
} from 'react-bootstrap'
import { AdminAuthContext } from '../context/AdminAuthContext'

const PAGE_SIZE = 10

const columns = [
  { key: 'title',       label: 'Title'    },
  { key: 'brand',       label: 'Brand'    },
  { key: 'price',       label: 'Price',      numeric: true },
  { key: 'stock',       label: 'Stock',      numeric: true },
  { key: 'disabled',    label: 'Disabled' },
  { key: 'sellerName',  label: 'Seller'   },
  { key: 'reviewCount', label: 'Reviews',   numeric: true }
]

export default function AdminListings() {
  const { isAdmin } = useContext(AdminAuthContext)

  const [listings,    setListings]    = useState([])
  const [allBrands,   setAllBrands]   = useState([])
  const [query,       setQuery]       = useState('')
  const [brandFilter, setBrandFilter] = useState('')

  // pagination + sorting
  const [page,    setPage]    = useState(1)
  const [sortBy,  setSortBy]  = useState('title')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => {
    if (!isAdmin) return
    fetchListings()
  }, [isAdmin, query, brandFilter])

  async function fetchListings() {
    const params = {}
    if (query)       params.query = query
    if (brandFilter) params.brand = brandFilter

    const { data } = await adminApi.get('/listings', { params })
    setListings(data)

    // rebuild brand dropdown
    const brands = Array.from(new Set(data.map(p => p.brand))).sort()
    setAllBrands(brands)

    // reset back to page 1
    setPage(1)
  }

  async function updateField(id, field, value) {
    await adminApi.put(`/listings/${id}`, { [field]: value })
    fetchListings()
  }
  async function deleteListing(id) {
    if (!window.confirm('Really delete this listing?')) return
    await adminApi.delete(`/listings/${id}`)
    fetchListings()
  }
  async function toggleDisabled(id, current) {
    await adminApi.put(`/listings/${id}`, { disabled: !current })
    setListings(ls =>
      ls.map(p => p._id === id ? { ...p, disabled: !current } : p)
    )
  }

  // 1) sort client-side
  const sorted = useMemo(() => {
    return [...listings].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      return 0
    })
  }, [listings, sortBy, sortDir])

  // 2) paginate client-side
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  // clicking column header toggles
  function onSort(colKey) {
    if (sortBy === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(colKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  return (
    <Container className="py-4">
      <h2>Listing Management</h2>

      <InputGroup className="mb-3">
        <FormControl
          placeholder="Search title…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Form.Select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
        >
          <option value="">All Brands</option>
          {allBrands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Form.Select>
        <Button variant="outline-secondary" onClick={fetchListings}>
          Refresh
        </Button>
      </InputGroup>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {col.label}{' '}
                {sortBy === col.key
                  ? (sortDir === 'asc' ? '↑' : '↓')
                  : '↕'
                }
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(p => (
            <tr key={p._id}>
              <td>
                <FormControl
                  defaultValue={p.title}
                  onBlur={e => updateField(p._id, 'title', e.target.value)}
                />
              </td>
              <td>
                <Form.Select
                  defaultValue={p.brand}
                  onBlur={e => updateField(p._id, 'brand', e.target.value)}
                >
                  <option value="">--</option>
                  {allBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <FormControl
                  type="number"
                  defaultValue={p.price}
                  onBlur={e => updateField(p._id, 'price', parseFloat(e.target.value))}
                />
              </td>
              <td>
                <FormControl
                  type="number"
                  defaultValue={p.stock}
                  onBlur={e => updateField(p._id, 'stock', parseInt(e.target.value, 10))}
                />
              </td>
              <td className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={p.disabled}
                  onChange={() => toggleDisabled(p._id, p.disabled)}
                />
              </td>
              <td>{p.sellerName}</td>
              <td>{p.reviewCount}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteListing(p._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination className="justify-content-center">
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
    </Container>
  )
}