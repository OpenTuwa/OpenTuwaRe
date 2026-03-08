import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import About from './pages/About';
import Archive from './pages/Archive';
import ArticleLayout from './pages/ArticleLayout';
import Legal from './pages/Legal';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/archive" element={<Layout><Archive /></Layout>} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/articles/:slug" element={<ArticleLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
