import { gql } from "@apollo/client";

export const COUNT = gql`
  query GetCounts {
    counts {
      inventories
      categories
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
      inventories {
        id
        name
        status
      }
    }
  }
`;

export const GET_INVENTORY_LENDING = gql`
  query GetInventoryLending {
    inventoryLending {
      id
      name
      mobileNumber
      address
      inventory {
        id
        name
        category {
          id
          name
        }
      }
      lendedDate
      returnDate
      remarks
      status
    }
  }
`;

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
