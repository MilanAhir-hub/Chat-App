const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Setup paths to compiled TS build in dist/
const { secureChatService } = require('../dist/services/secureChat.service');
const { User } = require('../dist/models/User');
const { SecureChat } = require('../dist/models/SecureChat');
const { SecureParticipant } = require('../dist/models/SecureParticipant');
const { SecureMessage } = require('../dist/models/SecureMessage');
const { decrypt } = require('../dist/utils/crypto');

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  let userA, userB;
  let cleanUpUsers = false;

  try {
    // 1. Setup Test Users
    userA = await User.findOne({ email: 'alice.test@example.com' });
    userB = await User.findOne({ email: 'bob.test@example.com' });

    if (!userA) {
      userA = await User.create({
        name: 'Alice Test',
        email: 'alice.test@example.com',
        password: await bcrypt.hash('password123', 10),
      });
      cleanUpUsers = true;
    }
    if (!userB) {
      userB = await User.create({
        name: 'Bob Test',
        email: 'bob.test@example.com',
        password: await bcrypt.hash('password123', 10),
      });
      cleanUpUsers = true;
    }

    const creatorId = userA._id.toString();
    const recipientId = userB._id.toString();

    console.log(`Using Test Users:\n  Alice: ${creatorId}\n  Bob: ${recipientId}`);

    // Clean up any existing chats between them first
    const existingParts = await SecureParticipant.find({ userId: creatorId }).distinct('chatId');
    const existingChatRecord = await SecureParticipant.findOne({
      chatId: { $in: existingParts },
      userId: recipientId,
    });
    if (existingChatRecord) {
      console.log('Removing old test secure chats...');
      await SecureChat.deleteOne({ _id: existingChatRecord.chatId });
      await SecureParticipant.deleteMany({ chatId: existingChatRecord.chatId });
      await SecureMessage.deleteMany({ chatId: existingChatRecord.chatId });
    }

    // 2. Test Secure Chat Creation
    console.log('\n--- Test 1: Creating Secure Chat ---');
    const passcode = 'SuperSecret123!';
    const chat = await secureChatService.createSecureChat(creatorId, recipientId, passcode);
    console.log('✓ Secure Chat created successfully. ID:', chat._id.toString());

    // 3. Test Hashing Verification
    console.log('\n--- Test 2: Passcode Hashing Verification ---');
    const isHashed = await bcrypt.compare(passcode, chat.passwordHash);
    if (!isHashed) {
      throw new Error('Passcode was not correctly hashed using bcrypt!');
    }
    if (chat.passwordHash === passcode) {
      throw new Error('Passcode is stored in plain text!');
    }
    console.log('✓ Passcode is securely hashed using bcrypt.');

    // 4. Test Verification / Unlock
    console.log('\n--- Test 3: Unlock Verification (Correct Passcode) ---');
    const unlockToken = await secureChatService.verifyAndUnlock(chat._id.toString(), creatorId, passcode);
    console.log('✓ Successfully unlocked. JWT Token:', unlockToken.substring(0, 30) + '...');

    console.log('\n--- Test 4: Unlock Verification (Incorrect Passcode) ---');
    try {
      await secureChatService.verifyAndUnlock(chat._id.toString(), creatorId, 'WrongPass123');
      throw new Error('Unlock should have failed with incorrect password, but it succeeded!');
    } catch (err) {
      if (err.statusCode === 401 || err.message.includes('Incorrect')) {
        console.log('✓ Correctly failed to unlock with wrong password.');
      } else {
        throw err;
      }
    }

    // 5. Test Encrypted Message Delivery & Decryption
    console.log('\n--- Test 5: Message Encryption & Decryption ---');
    const msgContent = 'This is a top-secret message!';
    const sentMsg = await secureChatService.createSecureTextMessage(
      chat._id.toString(),
      creatorId,
      'Alice Test',
      msgContent
    );

    // Retrieve raw message from database to prove it is encrypted
    const rawMsg = await SecureMessage.findById(sentMsg.id);
    if (!rawMsg) {
      throw new Error('Message could not be found in DB!');
    }
    console.log('Raw message content in MongoDB:', rawMsg.content);
    if (rawMsg.content === msgContent) {
      throw new Error('Message content is stored in plain text in MongoDB!');
    }
    console.log('✓ Verified: Message is encrypted in database.');

    // Decrypt content using crypto decrypt function
    const decryptedContent = decrypt(rawMsg.content);
    console.log('Decrypted content:', decryptedContent);
    if (decryptedContent !== msgContent) {
      throw new Error('Decrypted content does not match original message!');
    }
    console.log('✓ Verified: Decrypted content matches original message.');

    // Test service retrieval
    const messagesList = await secureChatService.getSecureMessages(chat._id.toString(), creatorId);
    if (messagesList.length !== 1 || messagesList[0].content !== msgContent) {
      throw new Error('Service getSecureMessages did not return decrypted content correctly!');
    }
    console.log('✓ Service returned decrypted history list.');

    // 6. Test Delivery / Seen Status Updates
    console.log('\n--- Test 6: Message Status & Receipts ---');
    const deliveredMsg = await secureChatService.markMessageAsDelivered(sentMsg.id, recipientId);
    if (!deliveredMsg.deliveredTo.includes(recipientId)) {
      throw new Error('Failed to update delivery receipts!');
    }
    console.log('✓ Delivery receipt successfully saved.');

    const seenMsg = await secureChatService.markMessageAsSeen(sentMsg.id, recipientId);
    if (!seenMsg.seenBy.includes(recipientId)) {
      throw new Error('Failed to update seen receipts!');
    }
    console.log('✓ Seen receipt successfully saved.');

    // 7. Clean up Chat Data
    console.log('\n--- Test 7: Clean up ---');
    await SecureChat.deleteOne({ _id: chat._id });
    await SecureParticipant.deleteMany({ chatId: chat._id });
    await SecureMessage.deleteMany({ chatId: chat._id });
    console.log('✓ Test secure chat data cleaned up.');

    if (cleanUpUsers) {
      await User.deleteOne({ _id: userA._id });
      await User.deleteOne({ _id: userB._id });
      console.log('✓ Test user accounts cleaned up.');
    }

    console.log('\n=========================================');
    console.log('ALL SECURE CHAT LOGIC TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
