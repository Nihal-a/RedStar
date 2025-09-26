// PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {
  REFRESH_MUTATION,
  VERIFY_MUTATION,
} from "./components/graphql/mutations";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [verifyToken] = useMutation(VERIFY_MUTATION);
  const [refreshToken] = useMutation(REFRESH_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      try {
        await verifyToken({ variables: { token } });
        setAuthenticated(true);
      } catch {
        try {
          const response = await refreshToken();
          const newToken = response?.data?.refreshToken?.token;
          if (newToken) {
            localStorage.setItem("token", newToken);
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        } catch {
          localStorage.removeItem("token");
          setAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [verifyToken, refreshToken]);

  if (loading) return <div>Loading...</div>;

  return authenticated ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
