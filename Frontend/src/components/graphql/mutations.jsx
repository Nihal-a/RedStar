import { gql } from "@apollo/client";

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!,$image: String) {
    createCategory(name: $name,image: $image) {
      category {
        id
        image
        name
        total
        available
      }
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $name: String) {
    updateCategory(id: $id, name: $name) {
      category {
        id
        name
      }
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      ok
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
