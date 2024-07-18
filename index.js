const express = require('express')
const path = require('path');
const mongoose = require('mongoose');
const Chat = require('./model/chat'); // Adjusted the path based on your structure
const app = express();
const port = 4000;
const server = app.listen(port, () => console.log(`💬 server on port ${port}`));

const io = require('socket.io')(server);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb+srv://sadneyasam:root@cluster0.e3jimf6.mongodb.net/chatapp', {
});

// Track connected sockets
let socketsConnected = new Set();

io.on('connection', socket => {
  console.log('Socket connected', socket.id);
  socketsConnected.add(socket.id);
  io.emit('clients-total', socketsConnected.size);

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    socketsConnected.delete(socket.id);
    io.emit('clients-total', socketsConnected.size);
  });

  socket.on('message', async data => {
    const { user, message, room } = data;
    const chatMessage = new Chat({ user, message, room, timestamp: new Date() });
    await chatMessage.save();
    io.to(room).emit('chat-message', data); // Emit message to all clients in the room
  });
  

  socket.on('join-room', room => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
    
    // Optionally fetch chat history for the room
    socket.emit('chat-history', async () => {
      const messages = await Chat.find({ room }).sort({ timestamp: 1 });
      messages.forEach(message => {
        socket.emit('chat-message', { ...message._doc, seen: false });
      });
    });
  });

  socket.on('feedback', data => {
    socket.broadcast.emit('feedback', data);
  });
});

// API endpoint to fetch chat messages
app.get('/api/chat/:room', async (req, res) => {
  const { room } = req.params;
  const messages = await Chat.find({ room }).sort({ timestamp: 1 });
  res.json(messages);
});
