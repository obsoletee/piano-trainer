import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import ContactsPage from "./pages/ContactsPage";
import PianoPage from "./pages/PianoPage";

import "./pages/Pages.css";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/exercises/piano" element={<PianoPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
