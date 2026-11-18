import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import ContactsPage from "./pages/ContactsPage";
import PianoPage from "./pages/PianoPage";
import NoteLiteracyPage from "./pages/NoteLiteracyPage";

import "./pages/Pages.css";

function AppLayout() {
  const location = useLocation();
  const isNoteLiteracyPage = location.pathname === "/exercises/note-literacy";

  return (
    <div
      className={`app-shell ${
        isNoteLiteracyPage ? "app-shell-note-literacy" : ""
      }`}
    >
      {!isNoteLiteracyPage && <Header />}

      <main
        className={`app-main ${
          isNoteLiteracyPage ? "app-main-note-literacy" : ""
        }`}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/exercises/piano" element={<PianoPage />} />
          <Route
            path="/exercises/note-literacy"
            element={<NoteLiteracyPage />}
          />
        </Routes>
      </main>

      {!isNoteLiteracyPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
