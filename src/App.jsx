import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import the 5 pages we just created from the pages folder!
import Home from './pages/Home';
import About from './pages/About';
import Archive from './pages/Archive';
import ArticleLayout from './pages/ArticleLayout';
import Legal from './pages/Legal';

export default function App() {
  return (
    <BrowserRouter>
      {/* Routes is the "Switcher" that looks at the URL and shows the right page */}
      <Routes>
        
        {/* If the user goes to domain.com/, show the Home page */}
        <Route path="/" element={<Home />} />
        
        {/* If the user goes to domain.com/about, show the About page */}
        <Route path="/about" element={<About />} />
        
        {/* If the user goes to domain.com/archive, show the Archive page */}
        <Route path="/archive" element={<Archive />} />
        
        {/* If the user goes to domain.com/legal, show the Legal page */}
        <Route path="/legal" element={<Legal />} />
        
        {/* The dynamic article page! 
          The ":slug" part tells React to catch anything after /articles/
          and pass it to ArticleLayout.jsx (which uses useParams to grab it).
        */}
        <Route path="/articles/:slug" element={<ArticleLayout />} />

      </Routes>
    </BrowserRouter>
  );
}