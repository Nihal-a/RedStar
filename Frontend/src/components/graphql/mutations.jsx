import { gql } from "@apollo/client";

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($ID: Int!) {
    createCategory(name: $name) {
      category {
        id
        name
        category
        author
      }
    }
  }
`;

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($name: String!, $category: ID!, $total: Int!) {
    createInventory(name: $name, category: $category, total: $total) {
      inventory {
        id
        name
        category {
          id
          name
        }
        total
      }
    }
  }
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($id: Int!) {
    deleteCategory(id: $id) {
      success
    }
  }
`;

export const CREATE_BOOK = gql`
  mutation CreateBook(
    $name: String!
    $category: String!
    $author: String!
    $total: Int!
  ) {
    createBook(
      name: $name
      category: $category
      author: $author
      total: $total
    ) {
      book {
        id
        name
        category
        author
      }
    }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id) {
      success
    }
  }
`;
