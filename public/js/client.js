document.addEventListener("DOMContentLoaded", () => {
  // Connect to the Socket.IO server
  const socket = io();

  let currentQuestionIndex = -1;
  let questionTimer; // Timer for moving to the next question
  let selectedAnswers = []; // Array to store user's selected answers

  const pathSegments = window.location.pathname.split("/");
  const roomId = pathSegments[pathSegments.length - 2]; // Penultimate segment
  const userId = pathSegments[pathSegments.length - 1]; // Last segment

  //score display
  const user1ScoreElement = document.getElementById("user1ScoreValue");
  const user2ScoreElement = document.getElementById("user2ScoreValue");
  const user1NameElement = document.getElementById("user1Name");
  const user2NameElement = document.getElementById("user2Name");


  const joinOrCreateRoom = () => {
    socket.emit("joinOrCreateRoom", { roomId });
  };

  // Event listener for the "Start Quiz" button
    const startQuizButton = document.getElementById("startQuizButton");
    startQuizButton.addEventListener("click", () => {
    joinOrCreateRoom();
  });

  const displayQuestion = (questions, quizRoomId) => {
    currentQuestionIndex++;
    let countdown = 10; // Initial countdown time in seconds

    if (currentQuestionIndex < questions.length) {
      const quizContainer = document.getElementById("quiz-container");
      quizContainer.innerHTML = ""; // Clear previous question

      // Display the current question and options
      const question = questions[currentQuestionIndex];
      const questionElement = document.createElement("div");
      questionElement.innerHTML = `
        <h3>Question ${currentQuestionIndex + 1}:</h3>
        <p>${question.question}</p>
        <ul>
          <li><input type="checkbox" id="option0">${question.options[0]}</li>
          <li><input type="checkbox" id="option1">${question.options[1]}</li>
          <li><input type="checkbox" id="option2">${question.options[2]}</li>
        </ul>
      `;

      // Append the question to the quiz container
      quizContainer.appendChild(questionElement);

      // Update the countdown timer every second
      const countdownElement = document.getElementById("countdown");
      countdownElement.textContent = countdown;

      const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        // When the countdown reaches 0, clear the interval
        if (countdown === 0) {
          clearInterval(countdownInterval);
        }
      }, 1000); // Update the countdown every 1000 ms (1 second)

      // Set a timer to move to the next question automatically if no checkbox is selected
      questionTimer = setTimeout(() => {
        selectedAnswers.push(null); // Record null for unanswered questions
        displayQuestion(questions);
      }, 10000);

      // Add an event listener to the checkboxes to handle moving to the next question
      const checkboxes = quizContainer.querySelectorAll(
        'input[type="checkbox"]'
      );
      checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener("change", () => {
          // Clear the timer if a checkbox is selected
          clearInterval(countdownInterval);
          clearTimeout(questionTimer);
          // Record the selected answer
          selectedAnswers[currentQuestionIndex] = index;
          // Move to the next question immediately when a checkbox is selected
          displayQuestion(questions);
        });
      });
    } else {
      // All questions have been displayed
      const quizContainer = document.getElementById("quiz-container");
      quizContainer.innerHTML = "<p>Quiz Finished. Waiting for results...</p>";

      // Send the selected answers to the server for scoring
      socket.emit("submitAnswer", { roomId, userId, selectedAnswers });
    }
  };

  // Listen for the startQuiz event
  socket.on("startQuiz", (questions, quizRoomId) => {
    // Display the first question when the quiz starts
    displayQuestion(questions, quizRoomId);
  });

  socket.on("waitingForUser", (msg) => {
    // Display the first question when the quiz starts
    alert(msg);
  });


  // show user
  socket.on("usersInRoom", ({ users }) => {
    // Clear the previous content
    user1NameElement.innerHTML = "";
    user2NameElement.innerHTML = "";

    if (users.length === 0) {
      // If no users are available, display "Not available"
      user1NameElement.textContent = "Not available";
      user2NameElement.textContent = "Not available";
    } else if (users.length === 1) {
      // If only one user is available, display their name in the first element
      user1NameElement.textContent = users[0];
      user2NameElement.textContent = "Not available";
    } else {
      // If both users are available, display their names in the respective elements
      user1NameElement.textContent = users[0];
      user2NameElement.textContent = users[1];
    }
  });

  socket.on("updateScores", (userScores) => {
    // Update the user scores for both users
    user1NameElement.textContent = userScores[0].userName;
    user1ScoreElement.textContent = userScores[0].score;
    user2NameElement.textContent = userScores[1].userName;
    user2ScoreElement.textContent = userScores[1].score;

    // Determine the winner or if it's a tie
    let resultText = "";
    if (userScores[0].score > userScores[1].score) {
      resultText = ` Result is: ${userScores[0].userName} is the winner!`;
    } else if (userScores[0].score < userScores[1].score) {
      resultText = ` Result is:  ${userScores[1].userName} is the winner!`;
    } else {
      resultText = " Result is: It's a tie!";
    }

    // Update the quiz container with the result text
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = `<p>${resultText}</p>`;

    // Wait for 5 seconds and then delete the room
    setTimeout(() => {
      // Make a call to the server to delete the room
      socket.emit("deleteRoom", roomId.toString());
    }, 5000); // 5 seconds
  });

});
