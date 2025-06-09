import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosinterceptor';
import { useNavigate } from 'react-router-dom';
import '../css/EventForm.css';

const ControllerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); 
  useEffect(() => {
    const fetchAssignedEvents = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/events/controller/assigned-events');
        setEvents(res.data);
      } catch (err) {
        console.error('Error fetching assigned events:', err);
        setError('Failed to load assigned events');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedEvents();
  }, []);

  return (
    <div className="container my-4">
      <h2 className="mb-4" style={{ textAlign: 'center' }}>Controller Dashboard</h2>
      <h4 className="mb-4" style={{ textAlign: 'center',color:'black' }}>Assigned events</h4>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center my-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : events.length === 0 ? (
        <p>No events assigned.</p>
      ) : (
        <div className="row">
          {events.map((event) => (
            <div className="col-12 mb-3" key={event._id}>
              <div
                className="card shadow-sm"
                style={{ maxWidth: '350px', margin: '0 auto' }}
              >
                {event.image && (
                  <img
                    src={event.image}
                    className="card-img-top"
                    alt={event.title}
                    style={{ maxHeight: '150px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body p-2">
                  <h5 className="card-title" style={{ fontSize: '1.1rem' }}>{event.title}</h5>
                  <p className="card-text" style={{ fontSize: '0.9rem' }}>{event.description}</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                    <strong>Location:</strong> {event.location} <br />
                    <strong>Time:</strong> {new Date(event.startTime).toLocaleString()}
                  </p>
                  <button
                    className="btn btn-sm"
                    style={{ backgroundColor: '#7f55b1', color: 'white', padding: '4px 8px', fontSize: '0.85rem',justifyContent:'center' }}
                    onClick={() => navigate(`/controller/event/${event._id}/attendees`)} // ✅ navigate to new route
                  >
                    View Attendees
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControllerDashboard;
