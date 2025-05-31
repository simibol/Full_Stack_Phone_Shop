import React, { useEffect, useState, useContext, useMemo } from 'react'
import adminApi from '../api/adminApi'
import { AdminAuthContext } from '../context/AdminAuthContext'
import {
  Container, Table, InputGroup,
  FormControl, Button, Pagination
} from 'react-bootstrap'

const PAGE_SIZE = 10

export default function AdminReviews() {
  const { isAdmin } = useContext(AdminAuthContext)

  // — all hooks up here, unconditionally —
  const [reviews, setReviews]     = useState([])
  const [filters, setFilters]     = useState({ user:'', content:'', listing:'' })
  const [page,    setPage]        = useState(1)

  // fetch whenever filters or isAdmin change
  useEffect(() => {
    if (!isAdmin) return
    ;(async () => {
      const { data } = await adminApi.get('/reviews', { params: filters })
      setReviews(data)
      setPage(1) // reset to page 1 on new filter
    })()
  }, [isAdmin, filters])

  // toggle hidden flag
  const toggleHidden = async rid => {
    await adminApi.patch(`/reviews/${rid}/toggle-hidden`)
    // simple refetch
    const { data } = await adminApi.get('/reviews', { params: filters })
    setReviews(data)
  }

  // pagination calculation
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return reviews.slice(start, start + PAGE_SIZE)
  }, [reviews, page])

  // — early return after hooks —
  if (!isAdmin) {
    return (
      <Container className="py-4">
        <p><em>Unauthorized</em></p>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <h2>Review Moderation</h2>

      {/* Filters */}
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Filter by user name…"
          value={filters.user}
          onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
        />
        <FormControl
          placeholder="Filter by content…"
          value={filters.content}
          onChange={e => setFilters(f => ({ ...f, content: e.target.value }))}
        />
        <FormControl
          placeholder="Filter by listing ID…"
          value={filters.listing}
          onChange={e => setFilters(f => ({ ...f, listing: e.target.value }))}
        />
        <Button onClick={() => setPage(1)}>Refresh</Button>
      </InputGroup>

      {/* Table */}
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Listing</th>
            <th>User</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Hidden?</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(r => (
            <tr key={r._id}>
              <td>{r.listingTitle}</td>
              <td>{r.reviewerName}</td>
              <td>{r.rating}</td>
              <td style={{ color: r.hidden ? '#888' : '#000' }}>
                {r.comment}
              </td>
              <td>{r.hidden ? 'yes' : 'no'}</td>
              <td>
                <Button
                  size="sm"
                  variant={r.hidden ? 'success' : 'secondary'}
                  onClick={() => toggleHidden(r._id)}
                >
                  {r.hidden ? 'Unhide' : 'Hide'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <Pagination className="justify-content-center">
        <Pagination.Prev
          onClick={() => setPage(p => Math.max(1, p - 1))}
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
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        />
      </Pagination>
    </Container>
  )
}