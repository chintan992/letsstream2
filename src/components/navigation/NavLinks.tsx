import { Link, useLocation } from "react-router-dom";

const NavLinks = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    { name: "Home", path: "/" },
    { name: "Movies", path: "/movie" },
    { name: "TV Shows", path: "/tv" },
    { name: "Sports", path: "/sports" },
    { name: "Simkl", path: "/simkl" },
    { name: "Trending", path: "/trending" },
  ];

  return (
    <nav className="hidden space-x-6 md:flex">
      {links.map(link => (
        <Link
          key={link.path}
          to={link.path}
          aria-current={isActive(link.path) ? "page" : undefined}
          className={`text-sm transition-colors hover:text-white ${
            isActive(link.path) ? "font-medium text-white" : "text-white/70"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
};

export default NavLinks;
