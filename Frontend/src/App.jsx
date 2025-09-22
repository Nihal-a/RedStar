import React from "react";
import { useState } from "react";
import "./App.css?v=1.0";
import { Route, Routes } from "react-router-dom";
import Signin from "./components/Signin";
import Home from "./components/landing/Home";
import PdfTemplate from "./components/utils/pdfTemplate";

function App() {
  return (
    <>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<PdfTemplate />} />
        <Route path="/printpdf/:type" element={<PdfTemplate />} />
      </Routes>
    </>
  );
}

export default App;
