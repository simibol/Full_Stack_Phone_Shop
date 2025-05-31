import React, { useEffect, useState, useContext, useMemo } from 'react'
import adminApi from '../api/adminApi'
import { AdminAuthContext } from '../context/AdminAuthContext'
import {
  Container, Table, InputGroup,
  FormControl, Button, Modal, Form,
  Pagination, FormCheck
} from 'react-bootstrap'

const PAGE_SIZE = 10

export default function AdminUsers() {
  const { isAdmin } = useContext(AdminAuthContext)

  // ——— State / Hooks (always at top in same order) ———
  const [users,       setUsers]       = useState([])
  const [query,       setQuery]       = useState('')
  const [editingUser, setEditingUser] = useState(null)

  // pagination + sorting
  const [page,     setPage]    = useState(1)
  const [sortBy,   setSortBy]  = useState('name')
  const [sortDir,  setSortDir] = useState('asc')

  // ——— Data fetch ———
  useEffect(() => {
    if (!isAdmin) return
    (async () => {
      const { data } = await adminApi.get('/users', { params: { query } })
      setUsers(data)
      setPage(1)
    })()
  }, [isAdmin, query])

  // ——— Sort & paginate ———
  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      return 0
    })
  }, [users, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  const onSort = col => {
    if (sortBy === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  // ——— CRUD helpers ———
  const toggleDisabled = async (id, currentlyDisabled) => {
    if (!currentlyDisabled) {
      const ok = window.confirm(
        `Are you sure you want to disable this user? Disabled users cannot log in.`
      )
      if (!ok) return
    }
    await adminApi.put(`/users/${id}`, { disabled: !currentlyDisabled })
    setUsers(us =>
      us.map(u => u._id === id ? { ...u, disabled: !currentlyDisabled } : u)
    )
  }

  const openEdit = u => {
    const [first, ...rest] = u.name.split(' ')
    setEditingUser({
      _id: u._id,
      firstname: first || '',
      lastname:  rest.join(' ') || '',
      email:     u.email,
      disabled:  u.disabled
    })
  }

  const saveEdit = async () => {
    const { _id, firstname, lastname, email, disabled } = editingUser
    await adminApi.put(`/users/${_id}`, {
      firstname, lastname, email, disabled
    })
    setEditingUser(null)
    // refresh list
    const { data } = await adminApi.get('/users', { params: { query } })
    setUsers(data)
  }

  const deleteUser = async id => {
    if (!window.confirm('Really delete this user?')) return
    await adminApi.delete(`/users/${id}`)
    setUsers(us => us.filter(u => u._id !== id))
  }

  // ——— Early guard ———
  if (!isAdmin) {
    return (
      <Container className="py-4">
        <p><em>Unauthorized — please log in as admin.</em></p>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <h2>User Management</h2>

      {/* Search */}
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Search name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button onClick={() => setPage(1)}>Search</Button>
      </InputGroup>

      {/* Table */}
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th onClick={() => onSort('name')} style={{ cursor:'pointer' }}>
              Name {sortBy==='name'? (sortDir==='asc'?'↑':'↓') : '↕'}
            </th>
            <th onClick={() => onSort('email')} style={{ cursor:'pointer' }}>
              Email {sortBy==='email'? (sortDir==='asc'?'↑':'↓') : '↕'}
            </th>
            <th onClick={() => onSort('lastLogin')} style={{ cursor:'pointer' }}>
              Last Login {sortBy==='lastLogin'? (sortDir==='asc'?'↑':'↓') : '↕'}
            </th>
            <th>Disabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {u.lastLogin
                  ? new Date(u.lastLogin).toLocaleString()
                  : '—'}
              </td>
              <td className="text-center">
                <FormCheck
                  type="checkbox"
                  checked={u.disabled}
                  onChange={() => toggleDisabled(u._id, u.disabled)}
                />
              </td>
              <td>
                <Button size="sm" onClick={() => openEdit(u)}>
                  Edit
                </Button>{' '}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteUser(u._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <Pagination className="justify-content-center">
        <Pagination.Prev
          onClick={() => setPage(p => Math.max(1, p-1))}
          disabled={page===1}
        />
        {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
          <Pagination.Item
            key={n}
            active={n===page}
            onClick={()=>setPage(n)}
          >
            {n}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => setPage(p => Math.min(totalPages, p+1))}
          disabled={page===totalPages}
        />
      </Pagination>

      {/* Edit Modal */}
      <Modal show={!!editingUser} onHide={()=>setEditingUser(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        {editingUser && (
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  value={editingUser.firstname}
                  onChange={e =>
                    setEditingUser(u=>({...u, firstname:e.target.value}))
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  value={editingUser.lastname}
                  onChange={e =>
                    setEditingUser(u=>({...u, lastname:e.target.value}))
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={editingUser.email}
                  onChange={e =>
                    setEditingUser(u=>({...u, email:e.target.value}))
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setEditingUser(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}