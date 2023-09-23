const express = require('express');
const router = express.Router();
const Room = require('../model/Room');

router.get('/', async (req, res) => {
  try {
    // Fetch the single room from the database
    const room = await Room.findOne();
    res.render('home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/join', async (req, res) => {
  const { userName } = req.body;

  try {
    const room = await Room.findOne();

    if (room.users.length < room.maxUsers) {
      // Add the user to the room
      room.users.push({ name: userName });
      await room.save();
      res.redirect('/quiz');
    } else {
      res.status(400).send('Room is full.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/quiz', async (req, res) => {
  try {
    const room = await Room.findOne();

    if (room.users.length === 2) {
      // Start the game logic
      // Render the quiz page for both users
      res.render('quiz', { room });
    } else {
      res.send('Waiting for another user to join...');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
