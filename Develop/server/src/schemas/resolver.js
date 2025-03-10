import { AuthenticationError } from 'apollo-server-errors';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
const resolvers = {
    Query: {
        // Returns the profile of the logged-in user
        profile: async (_parent, _args, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            const user = await User.findById(context.user._id);
            if (!user) {
                throw new Error('User not found!');
            }
            return user;
        },
        // Get a single user by id or username
        getSingleUser: async (_parent, { id, username }) => {
            if (!id && !username) {
                throw new Error('Provide either an ID or a username');
            }
            const foundUser = await User.findOne({
                $or: [{ _id: id }, { username }],
            });
            if (!foundUser) {
                throw new Error('Cannot find a user with this ID or username!');
            }
            return foundUser;
        },
    },
    Mutation: {
        // Create a new user and return auth token and user data
        createUser: async (_parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            if (!user) {
                throw new Error('Something went wrong!');
            }
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },
        // Authenticate a user and return auth token and user data
        login: async (_parent, { username, email, password }) => {
            const user = await User.findOne({ $or: [{ username }, { email }] });
            if (!user) {
                throw new AuthenticationError("Can't find this user");
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Wrong password!');
            }
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },
        // Save a book to the user's savedBooks array
        saveBook: async (_parent, { book }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            try {
                const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: book } }, { new: true, runValidators: true });
                return updatedUser;
            }
            catch (err) {
                console.error(err);
                throw new Error('Error saving book');
            }
        },
        // Remove a book from the user's savedBooks array
        deleteBook: async (_parent, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true });
            if (!updatedUser) {
                throw new Error("Couldn't find user with this ID!");
            }
            return updatedUser;
        },
    },
};
export default resolvers;
