import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ExercisesPage from "./pages/ExercisesPage";
import ContactsPage from "./pages/ContactsPage";
import PianoPage from "./pages/PianoPage";
import NoteLiteracyPage from "./pages/NoteLiteracyPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { GameLayoutProvider } from "./context/GameLayoutProvider";
import { AuthProvider } from "./context/AuthProvider";
import { useGameLayout } from "./hooks/useGameLayout";

import "./pages/Pages.css";

function AppLayout() {
  const location = useLocation();
  const { hideHeaderFooter } = useGameLayout();
  const isNoteLiteracyPage = location.pathname === "/exercises/note-literacy";

  return (
    <div className={`app-shell ${isNoteLiteracyPage ? "app-shell-note-literacy" : ""}`}>
      {!hideHeaderFooter && <Header />}
      <main className={`app-main ${isNoteLiteracyPage ? "app-main-note-literacy" : ""}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/exercises/piano" element={<PianoPage />} />
          <Route path="/exercises/note-literacy" element={<NoteLiteracyPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameLayoutProvider>
          <AppLayout />
        </GameLayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
