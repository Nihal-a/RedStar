import { gql } from "@apollo/client";

//-------------------------CATEGORY MANAGMENT-----------------------------------------------------------------------------------------------------------------
// For auth
export const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
      refreshExpiresIn
    }
  }
`;

export const VERIFY_MUTATION = gql`
  mutation VerifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`;

export const REFRESH_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      payload
    }
  }
`;

export const DELETE_TOKEN_COOKIE_MUTATION = gql`
  mutation DeleteTokenCookie {
    deleteTokenCookie {
      deleted
    }
  }
`;

export const DELETE_REFRESH_TOKEN_COOKIE_MUTATION = gql`
  mutation DeleteRefreshTokenCookie {
    deleteRefreshTokenCookie(input: {}) {
      deleted
    }
  }
`;

export const REVOKE_TOKEN_MUTATION = gql`
  mutation RevokeToken {
    revokeToken {
      revoked
    }
  }
`;
export const CHANGE_PASS = gql`
  mutation ChangePassword(
    $oldPassword: String!
    $newPassword: String!
    $confirmPassword: String!
  ) {
    changePassword(
      oldPassword: $oldPassword
      newPassword: $newPassword
      confirmPassword: $confirmPassword
    ) {
      success
      message
    }
  }
`;

//-------------------------CATEGORY MANAGMENT-----------------------------------------------------------------------------------------------------------------

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $image: String) {
    createCategory(name: $name, image: $image) {
      category {
        id
        image
        name
      }
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $name: String, $image: String) {
    updateCategory(id: $id, name: $name, image: $image) {
      category {
        id
        name
        image
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

//--------------------INVENORY MANGMENT---------------------------------------------------------------------------------------------------------------------
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

//------------------INVENTORY LENDING MANAGMENT--------------------------------------------------------------------------------------------------------
export const ADD_INVENTORY_LENDING = gql`
  mutation addInventoryLending(
    $name: String!
    $inventory: ID!
    $mobileNumber: String!
    $address: String!
    $lendedDate: Date!
    $remarks: String
  ) {
    addInventoryLending(
      name: $name
      inventory: $inventory
      mobileNumber: $mobileNumber
      address: $address
      lendedDate: $lendedDate
      remarks: $remarks
    ) {
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
  }
`;

export const UPDATE_INVENTORY_LENDING = gql`
  mutation updateInventoryLending(
    $id: ID!
    $name: String
    $inventory: ID
    $mobileNumber: String
    $address: String
    $lendedDate: Date
    $returnDate: Date
    $remarks: String
  ) {
    updateInventoryLending(
      id: $id
      name: $name
      inventory: $inventory
      mobileNumber: $mobileNumber
      address: $address
      lendedDate: $lendedDate
      returnDate: $returnDate
      remarks: $remarks
    ) {
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
  }
`;

export const RETURN_INVENTORY_LENDING = gql`
  mutation returnInventoryLending(
    $id: ID!
    $returnDate: Date!
    $remarks: String
  ) {
    returnInventoryLending(
      id: $id
      returnDate: $returnDate
      remarks: $remarks
    ) {
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
  }
`;

export const DELETE_INVENTORY_LENDING = gql`
  mutation deleteInventoryLending($id: ID!) {
    deleteInventoryLending(id: $id) {
      ok
    }
  }
`;

//---------------------------------------------------------------------------------------------------------------------------------------------

export const ADD_MEMBERSHIP = gql`
  mutation AddMembership(
    $name: String!
    $address: String!
    $mobileNumber: String!
    $profile: String
    $dob: Date!
  ) {
    addMembership(
      name: $name
      address: $address
      mobileNumber: $mobileNumber
      profile: $profile
      dob: $dob
    ) {
      memberships {
        name
        address
        mobileNumber
        membershipId
        validuntil
        dob
      }
    }
  }
`;

export const UPDATE_MEMBERSHIP = gql`
  mutation UpdateMembership(
    $id: ID!
    $name: String
    $address: String
    $mobileNumber: String
    $profile: String
    $validuntil: Date
    $dob: Date
  ) {
    updateMembership(
      id: $id
      name: $name
      address: $address
      mobileNumber: $mobileNumber
      profile: $profile
      validuntil: $validuntil
      dob: $dob
    ) {
      memberships {
        id
        name
        address
        mobileNumber
        profile
        validuntil
        dob
      }
    }
  }
`;

export const RENEW_MEMBERSHIP = gql`
  mutation RenewMembership($id: ID!, $validuntil: Date!) {
    renewMembership(id: $id, validuntil: $validuntil) {
      memberships {
        id
        name
        address
        mobileNumber
        profile
        validuntil
      }
    }
  }
`;

export const DELETE_MEMBERSHIP = gql`
  mutation DeleteMembership($id: ID!) {
    deleteMembership(id: $id) {
      ok
    }
  }
`;

//---------------------------------------------------------------------------------------------------------------------------------------------

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
        total
        available
      }
    }
  }
`;

export const UPDATE_BOOK = gql`
  mutation UpdateBook(
    $id: ID!
    $name: String
    $category: String
    $author: String
    $total: Int
  ) {
    updateBook(
      id: $id
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
        total
        available
      }
    }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id) {
      ok
    }
  }
`;
//---------------------------------------------------------------------------------------------------------------------------------------------
export const ADD_BOOK_LENDING = gql`
  mutation createBookLending(
    $member: ID!
    $book: ID!
    $lendedDate: Date!
    $remarks: String
  ) {
    createBookLending(
      member: $member
      book: $book
      lendedDate: $lendedDate
      remarks: $remarks
    ) {
      bookLending {
        id
        member {
          id
          name
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
  }
`;

export const UPDATE_BOOK_LENDING = gql`
  mutation updateBookLending(
    $id: ID!
    $member: ID
    $book: ID
    $lendedDate: Date
    $returnDate: Date
    $remarks: String
  ) {
    updateBookLending(
      id: $id
      member: $member
      book: $book
      lendedDate: $lendedDate
      returnDate: $returnDate
      remarks: $remarks
    ) {
      bookLending {
        id
        member {
          id
          name
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
  }
`;

export const RETURN_BOOK_LENDING = gql`
  mutation returnBookLending($id: ID!, $returnDate: Date!, $remarks: String) {
    returnBookLending(id: $id, returnDate: $returnDate, remarks: $remarks) {
      bookLending {
        id
        member {
          id
          name
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
  }
`;

export const DELETE_BOOK_LENDING = gql`
  mutation deleteBookLending($id: ID!) {
    deleteBookLending(id: $id) {
      ok
    }
  }
`;
