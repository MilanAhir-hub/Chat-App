
const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const msgs = await db.collection('messages').find({ replyTo: { $exists: true } }).sort({createdAt: -1}).limit(2).toArray();
  console.log(JSON.stringify(msgs, null, 2));
  process.exit(0);
}).catch(console.error);

