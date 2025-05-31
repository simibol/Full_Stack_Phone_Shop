import { Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import api from '../api/api';

export default function PhoneCard({ phone, showRating, showHideButton=false, showPrice = true, setListings=null, hiddenNow=false }) {
  const { title, image, price, avgRating = 0 } = phone;
  const imgSrc = `http://localhost:5001${image}`;
  const [ hidden, setHidden ] = useState(false);

  useEffect(() => {
    if (hiddenNow) {
      setHidden(true);
    } else {
      setHidden(false);
    } 
  }, [hiddenNow]);

  const toggleHidden = async () => {
    setHidden(!hidden);
    try {
      if (hidden) {
        await api.post(`/phones/unhide/${phone._id}`);
        toast.success('Phone is now visible');
      }
      else {
        await api.post(`/phones/hide/${phone._id}`);
        toast.success('Phone is now hidden');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error toggling visibility');
    }
  }

  const deletePhone = async () => {
    try {
      await api.delete(
        `/phones/${phone._id}`
      ).then(res => {
        toast.success('Phone deleted successfully');
        setListings(prev => prev.filter(p => p._id !== phone._id));
      })
    } catch (err) {
      console.error(err);
      toast.error('Error deleting phone');
    }
  }

  return (
    hidden ? (
      <div
        className="p-2 border rounded text-center"
        style={{ width: '200px', borderColor: '#ccc', backgroundColor: '#e6e6e6' }}
      >
        <img src={imgSrc} alt={title} style={{ height: 150, width: 150 }} />
        <p
          style={{
            fontSize: '.9rem',
            margin: '0.5rem 0',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {title}
        </p>
        {showPrice && <p style={{ fontWeight: 'bold' }}>${price.toFixed(2)}</p>}
        {showRating && <p style={{ color: '#f5a623' }}>⭐ {avgRating.toFixed(1)}</p>}
        {showHideButton && (
          <div>
            <Button variant="secondary" type="button" className="me-1" onClick={toggleHidden}>
              Show
            </Button>
            <Button variant="danger" type="button" className="me-1" onClick={deletePhone}>
              Delete
            </Button>
          </div>
        )}
    
      </div>
    ) : (
      <div
        className="p-2 border rounded text-center"
        style={{ width: '200px', borderColor: '#ccc' }}
      >
        {/* currently not hidden - visible */}
        <img src={imgSrc} alt={title} style={{ height: 150, width: 150 }} />
        <p
          style={{
            fontSize: '.9rem',
            margin: '0.5rem 0',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {title}
        </p>
        {showPrice && <p style={{ fontWeight: 'bold' }}>${price.toFixed(2)}</p>}
        {showRating && <p style={{ color: '#f5a623' }}>⭐ {avgRating.toFixed(1)}</p>}
        {showHideButton && (
          <div>
            <Button variant="primary" type="button" className="me-1" onClick={toggleHidden}>
              Hide
            </Button>
            <Button variant="danger" type="button" className="me-1" onClick={deletePhone}>
              Delete
            </Button>
          </div>
        )}
      </div>
    )
);
}