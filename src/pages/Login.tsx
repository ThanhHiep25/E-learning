import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // Support both location.state and query param redirect
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || (location.state as any)?.from?.pathname || "/";
  const closeTo = "/";

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, from, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthModal
        isOpen={open}
        initialMode="LOGIN"
        onClose={() => {
          setOpen(false);
          // Only navigate to home if user didn't log in (modal closed manually)
          if (!localStorage.getItem('elearning_user')) {
            navigate(closeTo, { replace: true });
          }
        }}
      />
    </div>
  );
};

export default Login;
