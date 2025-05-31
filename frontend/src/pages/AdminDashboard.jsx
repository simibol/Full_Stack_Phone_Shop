// in AdminDashboard.jsx
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin Dashboard</h2>
      <ul>
        <li><Link to="/admin/users">User Management</Link></li>
        <li><Link to="/admin/listings">Listing Management</Link></li>
        <li><Link to="/admin/reviews">Review Moderation</Link></li>
        <li><Link to="/admin/sales">Sales & Activity Logs</Link></li>
      </ul>
    </div>
  );
}