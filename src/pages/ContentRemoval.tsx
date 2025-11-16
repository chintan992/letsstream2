import { AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { useScrollRestoration } from "@/hooks";

const ContentRemoval = () => {
  useScrollRestoration();
  return (
    <AnimatePresence mode="wait">
      <div className="container mx-auto flex justify-center p-4">
        {" "}
        {/* Centering container */}
        <Card className="glass w-full max-w-4xl">
          {" "}
          {/* Apply Card and glass effect */}
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Content Removal
            </CardTitle>{" "}
            {/* Use CardTitle */}
          </CardHeader>
          <CardContent className="prose prose-invert">
            {" "}
            {/* Apply prose to content */}
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="mb-2 text-xl font-semibold text-white">
                Educational Project Notice
              </h2>
              <p className="text-white/80">
                This is an educational demonstration project. We do not host or
                store any media content. All content removal requests should be
                directed to the appropriate content owners or hosting services.
              </p>
            </div>
            <h2 className="mb-3 text-2xl font-semibold">
              Understanding Our Role
            </h2>
            <p className="mb-4">As an educational frontend demonstration:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>We do not host any media content</li>
              <li>Content is displayed through third-party APIs</li>
              <li>
                We have no control over the content provided by these services
              </li>
              <li>This project is for educational purposes only</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">
              How to Remove Content
            </h2>
            <p className="mb-4">If you wish to have content removed:</p>
            <ol className="mb-4 list-decimal pl-6">
              <li>Identify the specific content in question</li>
              <li>
                Determine which third-party service is hosting the content
              </li>
              <li>Contact the appropriate content host or owner directly</li>
              <li>Follow their content removal procedures</li>
            </ol>
            <h2 className="mb-3 text-2xl font-semibold">
              Third-Party Services
            </h2>
            <p className="mb-4">
              Content removal requests should be directed to the respective
              content owners or hosting services. We cannot process content
              removal requests as we do not host or control any media content.
            </p>
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-xl font-semibold text-white">
                Important Note
              </h3>
              <p className="text-white/80">
                This application may be discontinued at any time as it exists
                solely for educational and demonstration purposes. We are not
                responsible for any content displayed through third-party APIs.
              </p>
            </div>
            <h2 className="mb-3 text-2xl font-semibold">Contact</h2>
            <p className="mb-4">
              For questions about this educational demonstration, contact:
              <br />
              Email: demo@example.com (for demonstration purposes only)
            </p>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-white/80">Last updated: March 26, 2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatePresence>
  );
};

export default ContentRemoval;
