import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  useEffect(() => {
    // Initialize AOS scroll animations globally
    AOS.init({
      duration: 550,
      once: true,
      easing: "ease-out-cubic",
      offset: 40,
      delay: 0,
    });

    // Initialize theme on app load - Default to dark
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme ? savedTheme === "dark" : true;
    
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }, []);

  return (
    <AuthProvider>
      <div className="app-root">
        <Navbar />
        <main className="app-main">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
