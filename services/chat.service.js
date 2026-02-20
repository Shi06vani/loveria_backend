import db from "../models/index.js";
import { Op } from "sequelize";

const Message = db.Message;
const Auth = db.Auth;
const User = db.UserProfile;

export const createMessage = async ({ senderId, receiverId, content, type }) => {
  const receiverExists = await Auth.findByPk(receiverId);
  if (!receiverExists) {
    throw new Error("Receiver not found");
  }

  return await Message.create({
    senderId,
    receiverId,
    content,
    type,
  });
};

export const getMessagesBetweenUsers = async (userId1, userId2) => {
  return await Message.findAll({
    where: {
      [Op.or]: [
        { 
            senderId: userId1, 
            receiverId: userId2,
            isDeletedBySender: false 
        },
        { 
            senderId: userId2, 
            receiverId: userId1,
            isDeletedByReceiver: false 
        },
      ],
    },
    order: [["createdAt", "ASC"]],
  });
};

export const getUserConversations = async (userId) => {
  const messages = await Message.findAll({
    where: {
      [Op.or]: [
          { senderId: userId, isDeletedBySender: false },
          { receiverId: userId, isDeletedByReceiver: false }
      ],
    },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Auth,
        as: "sender",
        attributes: ["id", "name", "email"],
        include: [{ model: User, as: "profile", attributes: ["photo"] }],
      },
      {
        model: Auth,
        as: "receiver",
        attributes: ["id", "name", "email"],
        include: [{ model: User, as: "profile", attributes: ["photo"] }],
      },
    ],
  });

  const conversations = [];
  const seenUsers = new Set();

  for (const msg of messages) {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!seenUsers.has(otherUser.id)) {
      seenUsers.add(otherUser.id);
      conversations.push({
        user: otherUser,
        lastMessage: msg.content,
        timestamp: msg.createdAt,
      });
    }
  }

  return conversations;
};

export const deleteConversation = async (userId, targetUserId) => {
    // Mark sent messages as deleted
    await Message.update(
        { isDeletedBySender: true },
        {
            where: {
                senderId: userId,
                receiverId: targetUserId
            }
        }
    );

    // Mark received messages as deleted
    await Message.update(
        { isDeletedByReceiver: true },
        {
            where: {
                senderId: targetUserId,
                receiverId: userId
            }
        }
    );
    
    return true;
};

export const deleteMessage = async (userId, messageId) => {
    const message = await Message.findByPk(messageId);
    if (!message) {
        throw new Error("Message not found");
    }

    if (message.senderId === userId) {
        message.isDeletedBySender = true;
    } else if (message.receiverId === userId) {
        message.isDeletedByReceiver = true;
    } else {
        throw new Error("Unauthorized");
    }

    await message.save();
    return true;
};

export const updateMessage = async (userId, messageId, newContent) => {
    const message = await Message.findByPk(messageId);
    if (!message) {
        throw new Error("Message not found");
    }

    // Only sender can edit content
    if (message.senderId !== userId) {
        throw new Error("Unauthorized: Only sender can edit message");
    }

    message.content = newContent;
    message.isEdited = true;
    await message.save();
    return message;
};
