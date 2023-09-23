document.addEventListener("DOMContentLoaded", () => {
  // Connect to the Socket.IO server
  const socket = io();

  const joinOrCreateRoom = () => {
    // Get the room ID from the URL
    const roomId = window.location.pathname.split("/").pop();

    socket.emit("joinOrCreateRoom", { roomId });
  };


  // Listen for the startQuiz event
  socket.on("startQuiz", (questions, roomId) => {
    // Display the questions and options on the user interface


    const quizContainer = document.getElementById("quiz-container");

    questions.forEach((question, index) => {
      // Create HTML elements to display the question and options
      const questionElement = document.createElement("div");
      questionElement.innerHTML = `
        <h3>Question ${index + 1}:</h3>
        <p>${question.question}</p>
        <ul>
          <li>${question.options[0]}</li>
          <li>${question.options[1]}</li>
          <li>${question.options[2]}</li>
        </ul>
      `;

      // Append the question to the quiz container
      quizContainer.appendChild(questionElement);
    });
  });

  // Event listener for the "Start Quiz" button
const startQuizButton = document.getElementById("startQuizButton");
startQuizButton.addEventListener("click", () => {
  joinOrCreateRoom(); // Initiate joining or creating a room when the button is clicked
});


  // Event listener to change button color
  const colorChangeButton = document.getElementById("colorChangeButton");
  colorChangeButton.addEventListener("click", () => {
    colorChangeButton.style.backgroundColor = "red"; // Change the color to red
  });
});



