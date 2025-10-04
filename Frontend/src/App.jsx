import { Route, Routes } from "react-router-dom";
import Signin from "./components/Signin";
import Home from "./components/landing/Home";
import PrivateRoute from "./PrivateRoute";
import PdfTemplate from "./components/utils/PdfTemplate";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/report/:type"
        element={
          <PrivateRoute>
            <PdfTemplate />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
