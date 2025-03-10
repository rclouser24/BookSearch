import { gql } from '@apollo/client';

export const PROFILE = gql`
  query Profile {
    profile {
      _id
      username
      email
      savedBooks {
        bookId
        title
        authors
        description
        image
        link
      }
    }
  }
`;