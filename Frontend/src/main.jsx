import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import "./index.css";
import App from "./App.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Client from "./ApolloClient.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ApolloProvider client={Client}>
        <App />
      </ApolloProvider>
    </BrowserRouter>
  </StrictMode>
);
