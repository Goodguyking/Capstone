const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (adjust for production)
  },
});

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sibat', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');

  // Test the database connection
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('Database test query failed:', err);
    } else {
      console.log('Database test query succeeded:', results[0].result);
    }
  });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for messages from clients
  socket.on('sendMessage', (data) => {
    console.log('Message received:', data);

    // Validate senderId
    if (!data.senderId) {
      console.error('Error: senderId is missing or null');
      return;
    }

    // Save the message to the database
    const query = `
      INSERT INTO messages (chat_id, sender_id, content, type, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    db.query(query, [data.chatId, data.senderId, data.content, data.type], (err, result) => {
      if (err) {
        console.error('Failed to save message to the database:', err);
        return;
      }
      console.log('Message saved to the database:', result.insertId);

      // Fetch the sender's first name from the database
      const senderQuery = `
        SELECT first_name FROM users WHERE userid = ?
      `;
      db.query(senderQuery, [data.senderId], (err, senderResult) => {
        if (err) {
          console.error('Failed to fetch sender name:', err);
          return;
        }

        const senderName = senderResult[0]?.first_name || 'Unknown';

        // Broadcast the message to all clients in the same chat room
        io.to(data.chatId).emit('receiveMessage', {
          chatId: data.chatId,
          sender: senderName, // Use the first name of the sender
          senderId: data.senderId,
          content: data.content,
          type: data.type,
        });
      });
    });
  });

  // Join a chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('WebSocket server is running on port 3000');
});