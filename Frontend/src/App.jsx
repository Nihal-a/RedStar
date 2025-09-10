import React from "react";
import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Signin from "./components/Signin";
import Home from "./components/landing/home";
import BooksList from "./test";

function App() {

  return (
    <>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<BooksList />} />
      </Routes>
    </>
  );
}

export default App;
