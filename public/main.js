const socket = io();

const loginContainer = document.querySelector('.login-container');
const mainContainer = document.querySelector('.main');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const errorMessage = document.getElementById('login-error');

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const nameInput = document.getElementById('name-input');
const clientTotal = document.getElementById('client-total');
const roomInput = document.getElementById('room-input');
const joinRoomButton = document.getElementById('join-room');

let currentRoom = '';

// Listen for login button click
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    // Simulate authentication (replace with actual authentication logic)
    login(username);
  } else {
    errorMessage.textContent = 'Please enter a username';
  }
});

// Function to simulate login (replace with actual authentication logic)
function login(username) {
  // Display main chat interface and hide login
  loginContainer.style.display = 'none';
  mainContainer.classList.remove('hidden');
  
  // Update the nameInput value with the entered username
  nameInput.value = username;
}


socket.on('clients-total', data => {
  clientTotal.innerText = `Total clients: ${data}`;
});

socket.on('chat-message', data => {
  // Append the message from others
  appendMessage(data, 'message-left');
});

socket.on('feedback', data => {
  const feedback = document.getElementById('feedback');
  if (!feedback) {
    const feedbackElement = document.createElement('li');
    feedbackElement.classList.add('message-feedback');
    feedbackElement.setAttribute('id', 'feedback');
    feedbackElement.innerHTML = `<p class="feedback">✍️ ${data}</p>`;
    messageContainer.append(feedbackElement);
  } else {
    feedback.innerText = `✍️ ${data}`;
  }
});

joinRoomButton.addEventListener('click', () => {
  currentRoom = roomInput.value.trim();
  if (currentRoom) {
    socket.emit('join-room', currentRoom);
    fetch(`/api/chat/${currentRoom}`)
      .then(response => response.json())
      .then(messages => {
        messageContainer.innerHTML = '';
        messages.forEach(message => {
          appendMessage(message, 'message-left');
        });
      });
  }
});

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  const user = nameInput.value;
  if (message && currentRoom) {
    const data = {
      user,
      message,
      room: currentRoom,
      timestamp: new Date(),
    };

    // Emit the message
    socket.emit('message', data);
    messageInput.value = ''; // Clear input
  }
});

messageInput.addEventListener('keypress', () => {
  socket.emit('feedback', `${nameInput.value} is typing...`);
});

function appendMessage(data) {
  const element = document.createElement('li');
  
  // Check if the message is from the current user
  const className = data.user === nameInput.value ? 'message-right' : 'message-left';
  element.classList.add(className);
  
  element.innerHTML = `<p class="message">${data.message}<span>${data.user} ● ${moment(data.timestamp).format('HH:mm')}</span></p>`;
  messageContainer.append(element);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

