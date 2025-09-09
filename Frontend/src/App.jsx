import React from "react";
import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Signin from "./components/Signin";
import Home from "./components/landing/home";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
