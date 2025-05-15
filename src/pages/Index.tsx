
import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

const Index = () => {
  const { isAuthenticated } = useApp();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default Index;
