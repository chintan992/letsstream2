import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  ChevronDown,
  Heart,
  Smartphone,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

const FooterSection = ({

  title,

  children,

  id,

  isMobile,

  expandedSection,

  toggleSection,

}: {

  title: string;

  children: React.ReactNode;

  id: string;

  isMobile: boolean;

  expandedSection: string | null;

  toggleSection: (section: string) => void;

}) => {

  const isExpanded = expandedSection === id;



  return (

    <div className="w-full">

      {isMobile ? (

        <div className="w-full">

          <button

            onClick={() => toggleSection(id)}

            className="flex w-full items-center justify-between py-3 font-medium text-white"

          >

            <span>{title}</span>

            <ChevronDown

              className={`h-4 w-4 transition-transform duration-200 ${

                isExpanded ? "rotate-180 transform" : ""

              }`}

            />

          </button>

          <div

            className={`overflow-hidden transition-all duration-300 ease-in-out ${

              isExpanded ? "mb-4 max-h-60 opacity-100" : "max-h-0 opacity-0"

            }`}

          >

            {children}

          </div>

          {!isExpanded && <Separator className="my-1 bg-white/10" />}

        </div>

      ) : (

        <div className="w-full">

          <h3 className="mb-4 text-lg font-medium text-white">{title}</h3>

          {children}

        </div>

      )}

    </div>

  );

};



const Footer = () => {

  const currentYear = new Date().getFullYear();

  const isMobile = useIsMobile();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);



  const toggleSection = (section: string) => {

    if (expandedSection === section) {

      setExpandedSection(null);

    } else {

      setExpandedSection(section);

    }

  };



  return (

    <footer className="mt-auto border-t border-white/10 bg-gradient-to-b from-black/60 to-black pb-6 pt-8">

      <div className="mx-auto max-w-6xl px-4 md:px-8">

        <div

          className={`${

            isMobile ? "flex flex-col" : "grid grid-cols-1 gap-8 md:grid-cols-4"

          }`}

        >

          {/* About Section */}

          <FooterSection

            title="Let's Stream V2.0"

            id="about"

            isMobile={isMobile}

            expandedSection={expandedSection}

            toggleSection={toggleSection}

          >

            <p className="mb-4 text-sm text-white/70">

              Discover and enjoy the best movies and TV shows all in one place.

              Let's Stream V2.0 helps you find, explore, and watch your favorite

              content online.

            </p>

            {isMobile && (

              <div className="mb-2 flex items-center">

                <Smartphone className="mr-2 h-4 w-4 text-accent" />

                <span className="text-xs text-white/70">

                  Download our mobile app

                </span>

              </div>

            )}

          </FooterSection>



          {/* Quick Links */}

          <FooterSection

            title="Explore"

            id="explore"

            isMobile={isMobile}

            expandedSection={expandedSection}

            toggleSection={toggleSection}

          >

            <ul className="space-y-2 text-sm">

              <li>

                <Link

                  to="/"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Home

                </Link>

              </li>

              <li>

                <Link

                  to="/movies"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Movies

                </Link>

              </li>

              <li>

                <Link

                  to="/tv"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  TV Shows

                </Link>

              </li>

              <li>

                <Link

                  to="/trending"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Trending

                </Link>

              </li>

              <li>

                <Link

                  to="/search"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Search

                </Link>

              </li>

            </ul>

          </FooterSection>



          {/* Legal */}

          <FooterSection

            title="Legal"

            id="legal"

            isMobile={isMobile}

            expandedSection={expandedSection}

            toggleSection={toggleSection}

          >

            <ul className="space-y-2 text-sm">

              <li>

                <Link

                  to="/terms"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Terms of Service

                </Link>

              </li>

              <li>

                <Link

                  to="/privacy"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Privacy Policy

                </Link>

              </li>

              <li>

                <Link

                  to="/dmca"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  DMCA Notice

                </Link>

              </li>

              <li>

                <Link

                  to="/content-removal"

                  className="flex items-center text-white/70 transition-colors hover:text-accent"

                >

                  <span className="bg-accent/70 mr-2 h-1 w-1 rounded-full"></span>

                  Content Removal

                </Link>

              </li>

            </ul>

          </FooterSection>



          {/* Social */}

          <FooterSection

            title="Connect"

            id="connect"

            isMobile={isMobile}

            expandedSection={expandedSection}

            toggleSection={toggleSection}

          >

            <div className="flex flex-wrap gap-2">

              <a

                href="https://github.com/chintan992"

                className="hover:bg-accent/20 rounded-full bg-white/5 p-2 transition-all duration-200 hover:scale-105"

                aria-label="GitHub"

              >

                <Github className="h-5 w-5 text-white" />

              </a>

              <a

                href="https://x.com/sid992r"

                className="hover:bg-accent/20 rounded-full bg-white/5 p-2 transition-all duration-200 hover:scale-105"

                aria-label="Twitter"

              >

                <Twitter className="h-5 w-5 text-white" />

              </a>

              <a

                href="https://facebook.com/chintan992"

                className="hover:bg-accent/20 rounded-full bg-white/5 p-2 transition-all duration-200 hover:scale-105"

                aria-label="Facebook"

              >

                <Facebook className="h-5 w-5 text-white" />

              </a>

              <a

                href="https://instagram.com/chintan992"

                className="hover:bg-accent/20 rounded-full bg-white/5 p-2 transition-all duration-200 hover:scale-105"

                aria-label="Instagram"

              >

                <Instagram className="h-5 w-5 text-white" />

              </a>

              <a

                href="mailto:chintanr21@gmail.com"

                className="hover:bg-accent/20 rounded-full bg-white/5 p-2 transition-all duration-200 hover:scale-105"

                aria-label="Email"

              >

                <Mail className="h-5 w-5 text-white" />

              </a>

            </div>

            <p className="mt-4 flex items-center text-xs text-white/50">

              <span className="mr-1">Powered by</span>

              <a

                href="https://www.themoviedb.org/"

                className="transition-colors hover:text-accent"

                target="_blank"

                rel="noopener noreferrer"

              >

                TMDB

              </a>

            </p>

          </FooterSection>

        </div>



        <div className="mt-8 border-t border-white/10 pt-4 text-center">

          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">

            <p className="flex items-center text-xs text-white/50">

              © {currentYear} Let's Stream V2.0. All rights reserved.

              <span className="mx-1 inline-flex items-center">

                Built with{" "}

                <Heart className="mx-1 h-3 w-3 text-accent" fill="#E63462" /> by

                the community

              </span>

            </p>



            <p className="hidden text-xs text-white/50 md:block">

              This site does not store any files on its server. All contents are

              provided by non-affiliated third parties.

            </p>

          </div>



          {isMobile && (

            <p className="mt-2 text-xs text-white/50">

              This site does not store any files on its server.

            </p>

          )}

        </div>

      </div>

    </footer>

  );

};

export default Footer;
