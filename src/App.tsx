import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<div className="p-10 text-center font-bold text-gray-500">Coming Soon...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
