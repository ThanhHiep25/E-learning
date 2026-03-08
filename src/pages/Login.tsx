import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const from = (location.state as any)?.from?.pathname || "/";
  const closeTo = "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthModal
        isOpen={open}
        initialMode="LOGIN"
        onClose={() => {
          setOpen(false);
          navigate(closeTo, { replace: true });
        }}
      />
    </div>
  );
};

export default Login;
