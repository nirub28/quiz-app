function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const Room = require("./model/Room");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect("mongodb://localhost/quiz-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Serve the home page
app.get("/", (req, res) => {
  res.render("home");
});

app.post("/join", async (req, res) => {
  const { userName } = req.body;

  try {
    // Find a room with an empty slot (maxUsers not reached)
    const room = await Room.findOne({ "users.1": { $exists: false } });

    let roomId;
    let userId;

    if (room) {
      // Add the user to the found room
      room.users.push({ name: userName });
      await room.save();
      userId = room.users[1]._id;
      roomId = room._id;
    } else {
      // If no room is available, create a new room and add the user
      const newRoom = new Room({ users: [{ name: userName }] });
      await newRoom.save();
      userId = newRoom.users[0]._id;
      roomId = newRoom._id;
    }

    // After adding the user to the room, redirect to the quiz page for that room
    res.redirect(`/quiz/${roomId}/${userId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Serve the quiz page
app.get("/quiz/:roomId/:userId", async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId);

  if (!room) {
    res.status(404).send("Room not found");
    return;
  }

  res.render("quiz", { room });
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("joinOrCreateRoom", async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);

      room.completeUserCount=0;
      await room.save();

      if (!room) {
        // Handle room not found
        return;
      }



      if (room.users.length === 2) {
        console.log("Both users have joined. Starting quiz...");
        // Start the quiz here (replace this with your quiz logic)
        const quizData = fs.readFileSync(
          path.join(__dirname, "quiz-questions.json"),
          "utf8"
        );
        const quizquestions = JSON.parse(quizData);

        // Shuffle and select 5 random questions for the quiz
        const shuffledQuestions = shuffleArray(quizquestions.questions);
        const selectedQuestions = shuffledQuestions.slice(0, 5);

        const correctAnswers = selectedQuestions.map(
          (question) => question.correctAnswer
        );
        room.answers = correctAnswers;
        await room.save();

        io.emit("startQuiz", selectedQuestions, roomId); // Broadcast to all users in the room
      } else {
        // Send a message back to the client indicating waiting for another user
        socket.emit("waitingForUser", "Waiting for another user to join...");
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("submitAnswer", async ({ roomId, userId, selectedAnswers }) => {
    console.log("room id is:", roomId + " " + "user id:" + userId);

    console.log("submiteed answers:", selectedAnswers);

    // Find the room and user based on roomId and userId
    const room = await Room.findById(roomId);

    if (!room) {
      // Room not found
      console.error(`Room with ID ${roomId} not found.`);
      return;
    }

    // Find the user within the room based on userId
    const user = room.users.find((u) => u._id.toString() === userId);

    if (!user) {
      console.log("not getting user");
      return;
    }

    console.log("will calculate and tell");

    // Get the correct answers stored in the room
    const correctAnswers = room.answers;

    if (!correctAnswers) {
      console.error("Correct answers not found in the room.");
      return;
    }

    // Compare submitted answers with correct answers
    let score = 0;
    for (let i = 0; i < selectedAnswers.length; i++) {
      if (selectedAnswers[i] === correctAnswers[i]) {
        score += 10; // Increase score by 10 for each correct answer
      }
      // Continue to the next iteration without modifying the score for null values
    }

    console.log("score is;", score);

    // Update the user's score in the database
    user.score = score;
    await room.save(); // Save the updated score to the database

    room.completeUserCount = room.completeUserCount + 1;
    await room.save();

    // Check if all users have completed the quiz
  if (room.completeUserCount == 2) {
    // Emit scores for both users
    const userScores = room.users.map((u) => ({
      userName: u.name,
      score: u.score,
    }));

    console.log("emiting the score", userScores);


    // Emit the scores to all connected sockets
    io.emit("updateScores", userScores);
  }

  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // if (user) {
    //   room.users = room.users.filter((u) => u.name !== user.name);
    //   room.save(); // Remove the user from the room
    // }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
