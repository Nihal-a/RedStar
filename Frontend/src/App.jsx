import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import PrivateRoute from "./PrivateRoute";
import Signin from "./components/Signin";
import Home from "./components/landing/Home";
import {
  REFRESH_MUTATION,
  VERIFY_MUTATION,
} from "./components/graphql/mutations";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
