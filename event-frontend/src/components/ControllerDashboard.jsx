import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosinterceptor';
import '../css/EventForm.css'; // or your preferred CSS file

const ControllerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAssignedEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/events/controller/assigned-events');
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching assigned events:', err.response || err.message || err);
      setError('Failed to load assigned events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await axiosInstance.post('/messages/send', { content: message });
      setSuccess('Message sent to admin');
      setMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  return (
    <div className="container my-4">
      <h2 className="mb-4">Controller Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Assigned Events */}
      <div className="mb-5">
        <h4>Assigned Events</h4>
        {loading ? (
          <div className="d-flex justify-content-center my-4">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : events.length === 0 ? (
          <p>No events assigned.</p>
        ) : (
          <div className="row">
            {events.map((event) => (
              <div className="col-md-6 mb-3" key={event._id}>
                <div className="card shadow-sm">
                  {event.image && (
                    <img
                      src={event.image}
                      className="card-img-top"
                      alt={event.title}
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text">{event.description}</p>
                    <p>
                      <strong>Location:</strong> {event.location} <br />
                      <strong>Time:</strong> {new Date(event.startTime).toLocaleString()}
                    </p>
                    <p><strong>Capacity:</strong> {event.capacity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Admin */}
      <div className="mb-5">
        <h4>Contact Admin</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="4"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn"  style={{ backgroundColor: '#7f55b1' ,color:'white' }}>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ControllerDashboard;
