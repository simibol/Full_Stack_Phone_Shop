import { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

import api from '../api/api';



export default function ReviewCard({ r, isSeller, user, setReviews, pid }) {
  const [expandedComments, setExpandedComments] = useState({}); // which comments are fully expanded

  const toggleHidden = async rid => {
    try {
      await api.patch(`/phones/${pid}/reviews/${rid}/toggle-hidden`);
      // update UI if success
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review._id === rid 
            ? { ...review, hidden: !review.hidden }
            : review
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle review visibility');
    }
  };

  const toggleExpand = rid => {
    setExpandedComments(prev => ({
        ...prev,
        [rid]: !prev[rid]
    }));
  };

  return (
    <Card key={r._id} className="mb-3">
      <Card.Body style={{ backgroundColor: r.hidden ? '#e6e6e6' : '#fff' }}>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Subtitle className="mb-2">
            <strong>{r.reviewerName ? r.reviewerName : "Loading..."}</strong> — {r.rating}★
          </Card.Subtitle>
          {/* display the hide/unhide toggle if you are the author or the seller */}
          {(user?.id===r.reviewer || isSeller) && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-2"
              onClick={()=>toggleHidden(r._id)}
            >
              {r.hidden ? 'Unhide' : 'Hide'}
            </Button>
          )}
        </div>
        <Card.Text>
          {r.comment.length > 200 && !expandedComments[r._id]
            ? r.comment.slice(0,200) + '…'
            : r.comment}
        </Card.Text>
        {r.comment.length>200 && (
          <Button variant="link" size="sm" onClick={()=>toggleExpand(r._id)}>
            {expandedComments[r._id] ? 'Show less' : 'Read more'}
          </Button>
        )}
        
      </Card.Body>
    </Card>
  )
}