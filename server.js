import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import db from "./models/index.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as ChatService from "./services/chat.service.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all for dev. Update for production.
    methods: ["GET", "POST"],
  },
});

// Store connected users: userId -> socketId
const onlineUsers = new Map();

// Middleware for Socket Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);

  console.log(`User connected: ${userId}`);

  // Join a room for self (for specific notifications)
  socket.join(userId);

  // Send a message
  socket.on("sendMessage", async (data) => {
    try {
      const { receiverId, content, type } = data;
      
      // Save message to database
      const savedMessage = await ChatService.createMessage({
        senderId: userId,
        receiverId,
        content,
        type: type || "text",
      });
      
      const messageData = savedMessage.toJSON();
      // Need to include sender info if possible, or client fetches it.
      // For now, return raw message data.

      // Emit to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      } else {
        // Fallback: Receiver is offline. 
        // We could send push notification here if configured.
      }

      // Emit back to sender (to confirm sent and update UI with ID/timestamp)
      socket.emit("messageSent", messageData);

    } catch (error) {
      console.error("Socket sendMessage error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicators
  socket.on("typing", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });
  
  socket.on("stopTyping", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    onlineUsers.delete(userId);
  });
});

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database connected");
    httpServer.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });
