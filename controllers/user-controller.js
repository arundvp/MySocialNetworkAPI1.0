const { User, Thought } = require('../models');

const UserController = {
  // Get all users
  getAllUsers(req, res) {
    User.find({})
      .populate('thoughts')
      .then(userData => res.json(userData))
      .catch(err => res.status(500).json(err));
  },

  // Get user by ID
  getUserById(req, res) {
    User.findById(req.params.userId)
      .populate('thoughts')
      .then(userData => {
        if (!userData) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json(userData);
      })
      .catch(err => res.status(500).json(err));
  },

  // Create a user
  createUser(req, res) {
    User.create(req.body)
      .then(userData => res.json(userData))
      .catch(err => res.status(500).json(err));
  },

  // Update user by ID
  updateUserById(req, res) {
    User.findOneAndUpdate({ _id: req.params.userId }, req.body, { new: true })
      .then(userData => {
        if (!userData) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json(userData);
      })
      .catch(err => res.status(500).json(err));
  },

// Delete user by ID
async deleteUserById(req, res) {
  try {
      // Find the user by the given userId
      const user = await User.findById(req.params.userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Retrieve all of the user's thoughts
      const thoughts = await Thought.find({ _id: { $in: user.thoughts } });
      const thoughtIds = thoughts.map(thought => thought._id);

      // Remove reactions from each thought
      const removeReactionsPromises = thoughts.map(async (thought) => {
          thought.reactions = [];
          await thought.save();
      });

      // Wait for all reactions to be removed
      await Promise.all(removeReactionsPromises);

      // Delete all of the user's thoughts
      await Thought.deleteMany({ _id: { $in: thoughtIds } });

      // Finally, delete the user
      await User.deleteOne({ _id: req.params.userId });

      res.json({ message: 'User and associated thoughts & reactions deleted successfully' });
  } catch (err) {
      console.error("Error during user deletion:", err);
      res.status(500).json(err);
  }
},



  // Add a friend to user's friend list
  addFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $addToSet: { friends: req.body.friendId || req.params.friendId } },
      { new: true }
    )
      .then(userData => {
        if (!userData) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json(userData);
      })
      .catch(err => res.status(500).json(err));
  },

  // Remove a friend from user's friend list
  removeFriend({ params }, res) {
    User.findOneAndUpdate(
      { _id: params.userId },
      { $pull: { friends: params.friendId } },
      { new: true }
    )
      .then((dbUserData) => {
        if (!dbUserData) {
          return res.status(404).json({ message: "No user with this id!" });
        }
        const removed = !dbUserData.friends.includes(params.friendId);
        if (removed) {
          res.json({ message: "Friend removed successfully!", dbUserData });
        } else {
          res.json(dbUserData);
        }
      })
      .catch((err) => res.status(400).json(err));
  }
};

module.exports = UserController;
