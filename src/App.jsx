import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./pages/Header.jsx";
import { Footer } from "./pages/Footer.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { ArticlePage } from "./pages/ArticlePage.jsx";
import { IndexPage } from "./pages/IndexPage.jsx";
import { SubscribePage } from "./pages/SubscribePage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      {/* Keyboard users on a phone shouldn't have to tab the whole drawer
          before reaching content. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse/:topic" element={<IndexPage />} />
          <Route path="/article" element={<ArticlePage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
