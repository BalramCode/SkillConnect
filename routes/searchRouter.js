const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const groupModel = require("../model/groupModel");
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const ChatMessage = require("../model/messageModel");

router.get("/getResult", isLoggedIn, async (req, res) => {
  const search = req.query.search || "";
  try {
    const projects = await projectModel.find({
      projectName: { $regex: search, $options: "i" },
    });

    const message = req.query.message || null;

    res.render("Projects", {
      projects,
      user: req.user,  // NOW THIS EXISTS
      message,
    });
  } catch (error) {
    console.log(error);
    res.send("Something wrong");
  }
});

router.get("/search-users", isLoggedIn, async (req, res) => {
  const query = req.query.q;

  if (!query) return res.json([]);

  const users = await userModel.find({
    username: { $regex: query, $options: "i" }
  }).select("_id username");

  res.json(users);
});

router.get("/get-messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    
    // Find messages where sender/receiver match either direction
    const messages = await ChatMessage.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages); // Send the array back
  } catch (err) {
    console.error("DB Fetch Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// routes/searchRouter.js

router.get("/recent-chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Get all messages involving the user
    const messages = await ChatMessage.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    const orderedIds = [];
    const lastMessagesMap = {}; // To store the latest message for each user

    messages.forEach(msg => {
      if (msg && msg.sender && msg.receiver) {
        const otherPerson = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
        
        if (!orderedIds.includes(otherPerson)) {
          orderedIds.push(otherPerson);
          // Store the snippet and time of the first (newest) message found
          lastMessagesMap[otherPerson] = {
            text: msg.message,
            time: msg.time
          };
        }
      }
    });

    const User = require("../model/userModel");
    const usersData = await User.find({ _id: { $in: orderedIds } }).select("username _id");

    // 2. Combine user data with their last message
    const sortedRecentUsers = orderedIds.map(id => {
      const user = usersData.find(u => u._id.toString() === id);
      if (!user) return null;
      return {
        _id: user._id,
        username: user.username,
        lastMessage: lastMessagesMap[id].text,
        lastTime: lastMessagesMap[id].time
      };
    }).filter(Boolean);

    res.json(sortedRecentUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load recent chats" });
  }
});




module.exports = router;
