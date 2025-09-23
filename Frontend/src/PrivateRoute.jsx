import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { REFRESH_MUTATION, VERIFY_MUTATION } from "./components/graphql/mutations";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [verify] = useMutation(VERIFY_MUTATION);
  const [refreshToken] = useMutation(REFRESH_MUTATION);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    setIsAuthenticated(false);
  };

  const refreshAccessToken = async () => {
    try {
      const { data } = await refreshToken();
      if (data?.refresh?.token) {
        localStorage.setItem("token", data.refresh.token);
        localStorage.setItem("isLoggedIn", "true");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const verifyAccessToken = async (token) => {
    try {
      const { data } = await verify({ variables: { token } });
      return !!data?.verify?.payload;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logout();
        setLoading(false);
        return;
      }

      const valid = await verifyAccessToken(token);
      if (!valid) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          logout();
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default PrivateRoute;
