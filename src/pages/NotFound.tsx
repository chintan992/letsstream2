import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useScrollRestoration } from "@/hooks";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Film, Home, Tv2, Trophy, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useScrollRestoration();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-white">
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist on Let's Stream."
        noIndex={true}
      />
      <Navbar />

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="glass mx-auto max-w-lg rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="bg-accent/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-accent">
            <Compass className="animate-spin-slow h-10 w-10" />
          </div>

          <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
            404
          </h1>
          <h2 className="mb-4 text-2xl font-semibold text-white/90">
            Page Not Found
          </h2>
          <p className="mb-8 text-sm text-white/60">
            The page at{" "}
            <span className="font-mono text-accent">{location.pathname}</span>{" "}
            does not exist or may have moved.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="default" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/10"
            >
              <Link to="/movie">
                <Film className="h-4 w-4" />
                Movies
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/10 hover:bg-white/10"
            >
              <Link to="/tv">
                <Tv2 className="h-4 w-4" />
                TV Shows
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
