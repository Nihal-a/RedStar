import { Route, Routes, useNavigate } from "react-router-dom";
import Signin from "./components/Signin";
import Home from "./components/landing/Home";
import TestPage from "./test";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
