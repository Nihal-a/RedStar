import { gql } from "@apollo/client";
import { useMutation, useQuery  } from "@apollo/client/react";
import { useState } from "react";

// -------------------- GraphQL --------------------
const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
      refreshExpiresIn
    }
  }
`;

const VERIFY_MUTATION = gql`
  mutation VerifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`;

const REFRESH_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      payload
      refreshToken
      refreshExpiresIn
    }
  }
`;

const USER_QUERY = gql`
  query {
    user {
      id
      username
    }
  }
`;

// -------------------- React Component --------------------
function TestPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [message, setMessage] = useState("");

  const { data: userdata, loading, error, refetch } = useQuery(USER_QUERY, {
    context: { fetchOptions: { credentials: "include" } }, // HttpOnly cookie sent automatically
    skip: !authToken, // only query if token exists
  });

  const [login] = useMutation(LOGIN_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const [verifyToken] = useMutation(VERIFY_MUTATION);
  const [refreshToken] = useMutation(REFRESH_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  // -------------------- Handlers --------------------
  const handleLogin = async () => {
    try {
      const response = await login({ variables: { username, password } });
      const token = response.data.tokenAuth.token;
      setAuthToken(token);
      setMessage(response.data.tokenAuth.payload.username);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  const handleValidate = async () => {
    if (!authToken) return alert("No access token available");

    try {
      // Try to verify current token
      await verifyToken({ variables: { token: authToken } });
      alert("Token is valid!");
    } catch (err) {
      console.log("Access token expired, refreshing...", err.message);

      // If expired, call refreshToken mutation
      try {
        const response = await refreshToken();
        const newToken = response.data.refreshToken.token;
        setAuthToken(newToken);
        alert("Access token refreshed automatically!");
      } catch (refreshErr) {
        alert("Failed to refresh access token: " + refreshErr.message);
      }
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>JWT Auth Test Page</h2>

      {/* Login Form */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginRight: 10, padding: 5 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginRight: 10, padding: 5 }}
        />
        <button onClick={handleLogin} style={{ padding: "5px 10px" }}>
          Login
        </button>
        <button onClick={handleValidate} style={{ padding: "5px 10px", marginLeft: 10 }}>
          Validate Token
        </button>
      </div>

      {/* Display info */}
      <div>
        <strong>Access token:</strong> {authToken || "No token"} <br />
        <strong>Username:</strong> {message || "No user"} <br />
        <strong>User query data:</strong> {userdata ? JSON.stringify(userdata) : "N/A"}
      </div>
    </div>
  );
}

export default TestPage;