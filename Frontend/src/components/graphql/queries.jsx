import { gql } from "@apollo/client";

export const PRINT_PDF = gql`
  query printPdf {
    printPdf(path: "http://localhost:5173/printpdf/books") {
      url
    }
  }
`;

export const COUNT = gql`
  query GetCounts {
    counts {
      inventories
      issuedInvCurrently
      issuedInvTill
      books
      issuedBooksCurrently
      issuedBooksTill
      categories
      memberships
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      image
      inventories {
        id
        name
        status
      }
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
      }
      status
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

export const GET_MEMBERSHIPS = gql`
  query GetMemberships {
    memberships {
      id
      name
      address
      membershipId
      profile
      mobileNumber
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

export const GET_BOOK_LENDING = gql`
  query GetBookLending {
    bookLending {
      id
      member {
        id
        name
        membershipId
      }
      book {
        id
        name
      }
      lendedDate
      returnDate
      remarks
      status
    }
  }
`;
