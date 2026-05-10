
const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
const { Message } = require('./src/models/Message');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const msg = await Message.create({
      roomId: 'TEST01',
      sender: new mongoose.Types.ObjectId(),
      senderName: 'Test',
      content: 'test',
      replyTo: {
        id: new mongoose.Types.ObjectId(),
        content: 'test reply',
        senderName: 'Test User'
      }
    });
    console.log(msg);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});

