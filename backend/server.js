const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Enable CORS for REST API
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Serve uploaded images
app.use('/Capstone/backend/uploads/photos', express.static(path.join(__dirname, 'uploads/photos')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos'); // Save files in the uploads/photos folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Save the file with a unique name
  },
});

const upload = multer({ storage });

// Endpoint to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filename = req.file.filename;
  res.status(200).json({ message: 'Image uploaded successfully', filename });
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
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for text messages from clients
  socket.on('sendTextMessage', (data) => {
    console.log('Text message received:', data);

    const query = `
      INSERT INTO messages (chat_id, sender_id, content, type, filename, created_at)
      VALUES (?, ?, ?, 'text', NULL, NOW())
    `;
    db.query(query, [data.chatId, data.senderId, data.content], (err, result) => {
      if (err) {
        console.error('Failed to save text message to the database:', err);
        return;
      }

      const senderQuery = `
        SELECT first_name FROM users WHERE userid = ?
      `;
      db.query(senderQuery, [data.senderId], (err, senderResult) => {
        if (err) {
          console.error('Failed to fetch sender name:', err);
          return;
        }

        const senderName = senderResult[0]?.first_name || 'Unknown';

        io.to(data.chatId).emit('receiveMessage', {
          chatId: data.chatId,
          sender: senderName,
          senderId: data.senderId,
          content: data.content,
          type: 'text',
          filename: null,
          created_at: new Date().toISOString(),
        });
      });
    });
  });

// Track processed photo messages to prevent duplication
const processedPhotoMessages = new Set();

socket.on('sendPhotoMessage', (data) => {
  const messageKey = `${data.chatId}-${data.senderId}-${data.filename}`;

  // Check if the message has already been processed
  if (processedPhotoMessages.has(messageKey)) {
    console.log('Duplicate photo message detected. Skipping processing.');
    return;
  }

  // Add the message to the processed set
  processedPhotoMessages.add(messageKey);

  console.log('Photo message received:', data);

  const query = `
    INSERT INTO messages (chat_id, sender_id, content, type, filename, created_at)
    VALUES (?, ?, '', 'image', ?, NOW())
  `;
  db.query(query, [data.chatId, data.senderId, data.filename], (err, result) => {
    if (err) {
      console.error('Failed to save photo message to the database:', err);
      return;
    }

    console.log('Photo message saved to database:', result.insertId);

    const senderQuery = `
      SELECT first_name FROM users WHERE userid = ?
    `;
    db.query(senderQuery, [data.senderId], (err, senderResult) => {
      if (err) {
        console.error('Failed to fetch sender name:', err);
        return;
      }

      const senderName = senderResult[0]?.first_name || 'Unknown';

      console.log('Emitting photo message to chat room:', data.chatId);

      io.to(data.chatId).emit('receiveMessage', {
        chatId: data.chatId,
        sender: senderName,
        senderId: data.senderId,
        content: '',
        type: 'image',
        filename: data.filename,
        created_at: new Date().toISOString(),
      });

      // Remove the message from the processed set after a delay to prevent memory leaks
      setTimeout(() => processedPhotoMessages.delete(messageKey), 60000); // 1 minute
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

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});