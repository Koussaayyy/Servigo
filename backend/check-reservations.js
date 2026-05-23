const mongoose = require('mongoose');
const Reservation = require('./models/Reservation.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const reservations = await Reservation.find().select('_id status autoExpireAt createdAt bookingDate bookingHour');
    console.log('📋 All reservations:');
    reservations.forEach(r => {
      const now = new Date();
      const expireTime = r.autoExpireAt ? new Date(r.autoExpireAt) : null;
      const expired = expireTime && expireTime <= now;
      console.log(`  ID: ${r._id}`);
      console.log(`    Status: ${r.status}`);
      console.log(`    Booking: ${r.bookingDate} @ ${r.bookingHour}h`);
      console.log(`    AutoExpireAt: ${expireTime || 'NONE'}`);
      console.log(`    Expired? ${expired ? '✅ YES' : '❌ NO'}`);
    });
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});
