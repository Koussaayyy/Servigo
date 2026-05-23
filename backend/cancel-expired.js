const mongoose = require('mongoose');
const Reservation = require('./models/Reservation.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const now = new Date();
    const result = await Reservation.updateMany(
      { status: 'pending', autoExpireAt: { $lte: now } },
      { $set: { status: 'cancelled', cancellationReason: 'Auto-cancelled: Worker did not accept within 12 hours' } }
    );
    console.log('✅ Auto-cancelled', result.modifiedCount, 'expired reservations');
    
    // Show all pending reservations
    const pending = await Reservation.find({ status: 'pending' }).select('_id status autoExpireAt createdAt');
    console.log('📋 Remaining pending:', pending.length);
    
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});
