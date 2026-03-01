import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Cart from './pages/Cart';
import './App.css';
import { Toaster } from 'react-hot-toast';
import { ChevronUp, Phone } from 'lucide-react';
import { useState } from 'react';
import VirtualBot from './components/common/VirtualBot';
import { AuthProvider } from './context/AuthContext';

function App() {

  const [showScrollTop, setShowScrollTop] = useState(false);

  //Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

  };

  //Show scroll to top button when scroll down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  });


  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="*" element={<div className="p-10 text-center font-bold text-gray-500">Coming Soon...</div>} />
          </Route>
        </Routes>

        <VirtualBot />
        <Toaster position="bottom-left" reverseOrder={false} />

        {/* Floating Zalo Button */}
        <div className="fixed bottom-30 right-6 z-30 group">
          <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
          <div className="relative w-14 h-14 bg-blue-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
            <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png" alt="Zalo" className="w-8 h-8 object-contain mb-0.5" />
          </div>
        </div>

        {/* Floating Phone Button */}
        <div className="fixed bottom-50 right-6 z-30 group">
          <div className="absolute -inset-2 bg-green-400/20 rounded-full blur-xl group-hover:bg-green-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
          <div className="relative w-14 h-14 bg-green-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
            <Phone />
          </div>
        </div>

        {/* Scroll to top button */}
        {
          showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-30 group"
            >
              <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/40 transition-all opacity-0 group-hover:opacity-100"></div>
              <div className="relative w-14 h-14 bg-blue-500/50 backdrop-blur-sm rounded-full flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xl cursor-pointer border-2 border-white hover:scale-110 active:scale-95 transition-all">
                <ChevronUp />
              </div>
            </button>
          )
        }
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
