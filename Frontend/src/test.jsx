import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useState } from "react";

const GET_BOOKS = gql`
  query GetBooks {
    books {
      id
      name
      category
      author
    }
  }
`;

const CREATE_BOOK = gql`
  mutation CreateBook($name: String!, $category: String!, $author: String!) {
    createBook(name: $name, category: $category, author: $author) {
      book {
        id
        name
        category
        author
      }
    }
  }
`;

const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id) {
      ok
    }
  }
`;

function BooksList() {
  const { data, loading, error, refetch } = useQuery(GET_BOOKS);
  const [createBook] = useMutation(CREATE_BOOK);
  const [deleteBook] = useMutation(DELETE_BOOK);

  const [form, setForm] = useState({ name: "", category: "", author: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createBook({ variables: { ...form } });
    setForm({ name: "", category: "", author: "" });
    refetch(); // refresh list after adding
  };

  const handleDelete = async (id) => {
    await deleteBook({ variables: { id } });
    refetch(); // refresh list after deleting
  };

  if (loading) return <p>Loading books...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>📚 Book Manager</h2>

      {/* Create Book Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: "20px" }}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Book name"
          required
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          required
        />
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          placeholder="Author"
          required
        />
        <button type="submit">Add Book</button>
      </form>

      {/* Book List */}
      <ul>
        {data.books.map((book) => (
          <li key={book.id} style={{ marginBottom: "10px" }}>
            <b>{book.name}</b> — {book.category} by {book.author}
            <button
              onClick={() => handleDelete(book.id)}
              style={{ marginLeft: "10px", color: "red" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BooksList;
