const express = require('express');
const router = express.Router();
const Booking = require('../model/bookingData');
const Event = require('../model/eventData');
const User = require('../model/userData');
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const { eventId, userId, seats } = session.metadata;

    try {
      const user = await User.findById(userId);
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: eventId, availableSeats: { $gte: seats } },
        { $inc: { availableSeats: -seats } },
        { new: true }
      );
      
      if (!updatedEvent) {
        console.warn(`Not enough seats for event ${eventId}`);
        return;
      }

      // Create booking
      const qrData = `User: ${user.name}, Event: ${eventData.title}, Date: ${eventData.startTime}`;
      const qrCode = await QRCode.toDataURL(qrData);

      const booking = await Booking.create({
        userId,
        eventId,
        seats,
        qrcode: qrCode,
        status: 'booked',
        paymentStatus: 'paid',
        bookedAt: new Date(),
      });

      // Google Calendar link
      const start = new Date(eventData.startTime);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(eventData.description)}&location=${encodeURIComponent(eventData.location)}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: `Booking Confirmed for ${eventData.title}`,
        user,
        event: eventData,
        seats,
        qrcode: qrCode,
        calendarLink
      });

    } catch (err) {
      console.error('Failed to process booking in webhook:', err.message);
    }
  }

  res.status(200).send('Webhook received');
});

module.exports = router;
