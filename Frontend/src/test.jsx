import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";

const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
      refreshExpiresIn
    }
  }
`;

// --------------------
// Test Page Component
// --------------------
function TestPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login] = useMutation(LOGIN_MUTATION);

  const handleLogin = async () => {
    try {
      const response = await login({ variables: { username, password } });
      console.log(response);
      localStorage.setItem("token", response.data.tokenAuth.token);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out");
    refetch();
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
        <button
          onClick={handleLogout}
          style={{ padding: "5px 10px", marginLeft: 10 }}
        >
          Logout
        </button>
      </div>

      {/* Display current user */}
      <div></div>
    </div>
  );
}
export default TestPage;
