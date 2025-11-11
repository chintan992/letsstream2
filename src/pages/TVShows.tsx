import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TVShowsRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/tv", { replace: true });
  }, [navigate]);

  return null;
};

export default TVShowsRedirect;
