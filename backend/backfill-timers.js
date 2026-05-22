const mongoose = require('mongoose');
const Reservation = require('./models/Reservation.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    // Add 12 hours to createdAt for all pending reservations without autoExpireAt
    const reservations = await Reservation.find({ 
      status: 'pending', 
      autoExpireAt: { $in: [null, undefined] } 
    });
    
    for (const res of reservations) {
      const createdAt = new Date(res.createdAt);
      res.autoExpireAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);
      await res.save();
    }
    
    console.log('✅ Updated', reservations.length, 'pending reservations with autoExpireAt');
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});
