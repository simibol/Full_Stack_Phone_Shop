import React, { useEffect, useState, useContext, useMemo } from 'react';
import adminApi from '../api/adminApi';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  Container,
  Table,
  InputGroup,
  FormControl,
  Button,
  Pagination
} from 'react-bootstrap';

const PAGE_SIZE = 10;

export default function AdminSales() {
  const { isAdmin } = useContext(AdminAuthContext);
  const [sales,  setSales]  = useState([]);
  const [buyerQ, setBuyerQ] = useState('');

  // sorting state
  const [sortBy,  setSortBy]  = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // pagination state
  const [page, setPage] = useState(1);

  // fetch whenever admin or buyerQ changes
  useEffect(() => {
    if (isAdmin) fetchSales();
  }, [isAdmin, buyerQ]);

  async function fetchSales() {
    const params = {};
    if (buyerQ) params.buyer = buyerQ;
    const { data } = await adminApi.get('/sales', { params });
    setSales(data);
    setPage(1);
  }

  // 1) client-side sort
  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];

      if (sortBy === 'createdAt') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      // for items, compare total quantity
      if (sortBy === 'items') {
        const sumA = a.items.reduce((sum, i) => sum + i.quantity, 0);
        const sumB = b.items.reduce((sum, i) => sum + i.quantity, 0);
        av = sumA;
        bv = sumB;
      }
      // normalize strings
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();

      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      return 0;
    });
  }, [sales, sortBy, sortDir]);

  // 2) client-side paginate
  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedSales.slice(start, start + PAGE_SIZE);
  }, [sortedSales, page]);

  // header click toggles sort
  function onSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  function downloadCSV() {
    const header = ['Timestamp','Buyer','Items','Total'];
    const rows = sortedSales.map(o => [
      new Date(o.createdAt).toLocaleString(),
      o.buyerName,
      o.items.map(i => `${i.title}×${i.quantity}`).join('; '),
      o.total.toFixed(2)
    ]);
    const csv =
      [header, ...rows]
      .map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sales_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isAdmin) {
    return (
      <Container className="py-4">
        <p>Unauthorized</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2>Sales & Activity Logs</h2>

      <InputGroup className="mb-3">
        <FormControl
          placeholder="Filter by buyer…"
          value={buyerQ}
          onChange={e => setBuyerQ(e.target.value)}
        />
        <Button variant="outline-secondary" onClick={fetchSales}>
          Search
        </Button>
        <Button variant="outline-primary" onClick={downloadCSV}>
          Export CSV
        </Button>
      </InputGroup>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th
              onClick={() => onSort('createdAt')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Timestamp {sortBy === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th
              onClick={() => onSort('buyerName')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Buyer {sortBy === 'buyerName' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th
              onClick={() => onSort('items')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Items&nbsp;(×qty) {sortBy === 'items' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th
              onClick={() => onSort('total')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Total {sortBy === 'total' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
            </th>
          </tr>
        </thead>
        <tbody>
          {paged.map(o => (
            <tr key={o._id}>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>{o.buyerName}</td>
              <td style={{ maxWidth: 250 }}>
                {o.items.map(i => (
                  <div key={i.title}>
                    {i.title} × {i.quantity}
                  </div>
                ))}
              </td>
              <td>${o.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination className="justify-content-center">
        <Pagination.Prev
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        />
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pn => (
          <Pagination.Item
            key={pn}
            active={pn === page}
            onClick={() => setPage(pn)}
          >
            {pn}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        />
      </Pagination>
    </Container>
  );
}