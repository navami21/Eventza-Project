const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Event = require('../model/eventData');
const Booking = require('../model/bookingData');
const bookEvent = require('../utils/bookEvent');

// Book a FREE event (no payment required)
router.post('/:eventId', protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { seats } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.isPaid) {
      return res.status(400).json({ message: 'Paid event. Please complete payment to book.' });
    }

    const booking = await bookEvent({ eventId, user: req.user, seats });
    res.status(200).json({ message: 'Booking successful', booking });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// View user's bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your bookings' });
  }
});

module.exports = router;
