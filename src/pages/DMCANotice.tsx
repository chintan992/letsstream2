import { AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { useScrollRestoration } from "@/hooks";

const DMCANotice = () => {
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
            <CardTitle className="text-3xl font-bold">DMCA Notice</CardTitle>{" "}
            {/* Use CardTitle */}
          </CardHeader>
          <CardContent className="prose prose-invert">
            {" "}
            {/* Apply prose to content */}
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="mb-2 text-xl font-semibold text-white">
                Important Notice
              </h2>
              <p className="text-white/80">
                This is an educational demonstration project that does not host
                any content. All content is fetched from third-party APIs. DMCA
                notices should be directed to the respective content owners or
                hosting services.
              </p>
            </div>
            <h2 className="mb-3 text-2xl font-semibold">Our Role</h2>
            <p className="mb-4">
              This application is a frontend demonstration that:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>Does not host or store any media content</li>
              <li>Uses third-party APIs for educational purposes only</li>
              <li>Has no control over the content provided by these APIs</li>
              <li>May be discontinued at any time</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">Third-Party Content</h2>
            <p className="mb-4">For any copyright concerns:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Identify the specific content in question</li>
              <li>Contact the actual hosting service or content owner</li>
              <li>Submit DMCA notices to the appropriate content provider</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">Contact Information</h2>
            <p className="mb-4">
              While we do not host content, if you have questions about our
              educational demonstration, contact us at:
              <br />
              Email: demo@example.com (for demonstration purposes only)
            </p>
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-xl font-semibold text-white">
                Disclaimer
              </h3>
              <p className="text-white/80">
                We are not responsible for any content displayed through
                third-party APIs. This is purely an educational demonstration of
                frontend development techniques.
              </p>
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-white/80">Last updated: March 26, 2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatePresence>
  );
};

export default DMCANotice;
