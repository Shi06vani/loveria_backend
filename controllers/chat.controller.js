import * as ChatService from "../services/chat.service.js";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type } = req.body;
    const senderId = req.user.id;

    const message = await ChatService.createMessage({ senderId, receiverId, content, type });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    if (error.message === "Receiver not found") {
        return res.status(404).json({ message: "Receiver user not found" });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
       return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    const messages = await ChatService.getMessagesBetweenUsers(myId, userId);

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    const conversations = await ChatService.getUserConversations(myId);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.params;

        await ChatService.deleteConversation(userId, targetUserId);
        res.status(200).json({ message: "Conversation deleted successfully" });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        await ChatService.deleteMessage(userId, messageId);
        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        if (error.message === 'Message not found') {
            return res.status(404).json({ message: "Message not found" });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ message: "Unauthorized" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

export const updateMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { content } = req.body;

        const updatedMessage = await ChatService.updateMessage(userId, messageId, content);
        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error("Error updating message:", error);
        if (error.message === 'Unauthorized: Only sender can edit message') {
             return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error" });
    }
};
