import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {
  REFRESH_MUTATION,
  VERIFY_MUTATION,
} from "./components/graphql/mutations";

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

  const verifyAccessToken = async (token) => {
    try {
      const { data } = await verify({ variables: { token } });
      return !!data?.verifyToken?.payload;
    } catch (error) {
      console.log("Token verification failed:", error);
      return false;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const { data } = await refreshToken();

      if (data?.refreshToken?.token) {
        localStorage.setItem("token", data.refreshToken.token);
        localStorage.setItem("isLoggedIn", "true");
        console.log("Token refreshed successfully");
        return data.refreshToken.token;
      }
      return null;
    } catch (error) {
      console.log("Token refresh failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

        // If no token or not marked as logged in, redirect to signin
        if (!token || !isLoggedIn) {
          logout();
          setLoading(false);
          return;
        }

        // Verify current token
        const isTokenValid = await verifyAccessToken(token);

        if (isTokenValid) {
          // Token is valid, user is authenticated
          setIsAuthenticated(true);
        } else {
          // Token is invalid, try to refresh
          console.log("Access token invalid, attempting refresh...");
          const newToken = await refreshAccessToken();

          if (newToken) {
            // Refresh successful, verify the new token
            const isNewTokenValid = await verifyAccessToken(newToken);
            setIsAuthenticated(isNewTokenValid);

            if (!isNewTokenValid) {
              console.log("New token is also invalid, logging out");
              logout();
            }
          } else {
            // Refresh failed, logout
            console.log("Refresh failed, logging out");
            logout();
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [verify, refreshToken]);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupAutoRefresh = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const { data } = await verify({ variables: { token } });
        const payload = data?.verifyToken?.payload;

        if (payload) {
          const expiryTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;

          // Refresh token 2 minutes before it expires
          const refreshTime = Math.max(timeUntilExpiry - 2 * 60 * 1000, 1000);

          console.log(
            `Token expires in ${Math.round(
              timeUntilExpiry / 1000 / 60
            )} minutes`
          );
          console.log(
            `Will refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`
          );

          const timeoutId = setTimeout(async () => {
            console.log("Auto-refreshing token...");
            const newToken = await refreshAccessToken();

            if (!newToken) {
              console.log("Auto-refresh failed, logging out");
              logout();
              window.location.href = "/signin";
            } else {
              console.log("Auto-refresh successful");
              // Set up next auto-refresh
              setupAutoRefresh();
            }
          }, refreshTime);

          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.log("Error setting up auto-refresh:", error);
      }
    };

    setupAutoRefresh();
  }, [isAuthenticated, verify, refreshToken]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        <div>
          <div
            style={{
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #3498db",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              animation: "spin 1s linear infinite",
              margin: "0 auto 10px",
            }}
          />
          Loading...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};
export default PrivateRoute;
