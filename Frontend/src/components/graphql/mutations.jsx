import { gql } from "@apollo/client";

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!) {
    createCategory(name: $name) {
      category {
        id
        name
        total
        available
      }
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteInventory($id: Int!) {
    deleteCategory(id: $id) {
      success
    }
  }
`;

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($name: String!, $category: ID!) {
    createInventory(name: $name, category: $category) {
      inventory {
        id
        name
        category {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: ID!, $name: String, $category: ID) {
    updateInventory(id: $id, name: $name, category: $category) {
      inventory {
        id
        name
      }
    }
  }
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($id: ID!) {
    deleteInventory(id: $id) {
      ok
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
