const { AuthenticationError } = require("apollo-server-express");//
const { User } = require("../models");// Import the user model
const { signToken } = require("../utils/auth");// Import the signToken function from utils/auth.js

const resolvers = {
  Query: {
    me: async (parent, args, context) => {// Get user by id
      if (context.user) {
        const userData = await User
          .findOne({ _id: context.user._id })// Find user by id
          .select("-__v -password")// Exclude the __v and password fields
          .populate("books");// Populate the books field

        return userData;
      };
      throw new AuthenticationError("You must be logged in!");
    },
  },

  Mutation: {   
    login: async (parent, { email, password }) => {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) throw new AuthenticationError("Incorrect login credentials!");
      // Check if password is correct
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) throw new AuthenticationError("Incorrect login credentials!");
      
      const token = signToken(user);// Issue token

      return { token, user };// Return token and user
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });// Create user
      const token = signToken(user);// Issue token
      return { token, user };// Return token and user
    },
    saveBook: async (parent, { input }, context) => {
      if (context.user) {// If user is logged in
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },// Find user by id
          { $addToSet: { savedBooks: input } },// Add book to savedBooks array
          { new: true, runValidators: true },
        )
        .populate("books");// Populate the books field
        return updatedUser;// Return updated user
      }
      throw new AuthenticationError("You must be logged in to save books!");
    },  
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {// If user is logged in
        const updatedUser = await User.findOneAndUpdate(// Remove book from savedBooks array
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },// Remove book by bookId
          { new: true },
        );
        return updatedUser;// Return updated user
      }
      throw new AuthenticationError("You must be logged in to delete books!");
    },    
  },
};

module.exports = resolvers;
