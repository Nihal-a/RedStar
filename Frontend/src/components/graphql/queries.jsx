import { gql } from "@apollo/client";

export const GET_BOOKS = gql`
  query GetBooks {
    books {
      id
      name
      category
      author
      total
      available
    }
  }
`;

export const GET_INVENTORIES = gql`
  query GetInventories {
    inventories {
      id
      name
      category {
        id
        name
        total
        available
      }
      status
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      image
      total
      available
    }
  }
`;
