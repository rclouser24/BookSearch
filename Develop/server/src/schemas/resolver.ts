import { AuthenticationError } from 'apollo-server-errors';
import User, { UserDocument as IUser } from '../models/User.js';
import type { BookDocument as IBook } from '../models/Book.js';
import { signToken } from '../services/auth.js';

// Define argument interfaces for each resolver
interface GetSingleUserArgs {
  id?: string;
  username?: string;
}

interface CreateUserArgs {
  username: string;
  email: string;
  password: string;
}

interface LoginArgs {
  username?: string;
  email?: string;
  password: string;
}

interface SaveBookArgs {
  book: IBook;
}

interface DeleteBookArgs {
  bookId: string;
}

// Define the context interface (assuming user is added by your auth middleware)
interface Context {
  user?: IUser;
}

const resolvers = {
  Query: {
    // Returns the profile of the logged-in user
    profile: async (_parent: unknown, _args: unknown, context: Context): Promise<IUser> => {
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
    getSingleUser: async (
      _parent: unknown,
      { id, username }: GetSingleUserArgs
    ): Promise<IUser | null> => {
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
    createUser: async (
      _parent: unknown,
      { username, email, password }: CreateUserArgs
    ): Promise<{ token: string; user: IUser }> => {
      const user = await User.create({ username, email, password });
      if (!user) {
        throw new Error('Something went wrong!');
      }
      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    // Authenticate a user and return auth token and user data
    login: async (
      _parent: unknown,
      { username, email, password }: LoginArgs
    ): Promise<{ token: string; user: IUser }> => {
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
    saveBook: async (
      _parent: unknown,
      { book }: SaveBookArgs,
      context: Context
    ): Promise<IUser | null> => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        console.error(err);
        throw new Error('Error saving book');
      }
    },

    // Remove a book from the user's savedBooks array
    deleteBook: async (
      _parent: unknown,
      { bookId }: DeleteBookArgs,
      context: Context
    ): Promise<IUser | null> => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
      if (!updatedUser) {
        throw new Error("Couldn't find user with this ID!");
      }
      return updatedUser;
    },
  },
};

export default resolvers;