import { AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { useScrollRestoration } from "@/hooks";

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>{" "}
            {/* Use CardTitle */}
          </CardHeader>
          <CardContent className="prose prose-invert">
            {" "}
            {/* Apply prose to content */}
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <h2 className="mb-2 text-xl font-semibold text-white">
                Educational Demonstration Notice
              </h2>
              <p className="text-white/80">
                This application is an educational demonstration that uses
                third-party APIs. We prioritize your privacy while demonstrating
                frontend development concepts.
              </p>
            </div>
            <h2 className="mb-3 text-2xl font-semibold">
              1. Information Collection
            </h2>
            <p className="mb-4">
              We collect minimal information necessary for the educational
              demonstration:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>
                Basic account information (if you choose to create an account)
              </li>
              <li>Watch history and preferences (stored locally)</li>
              <li>Usage analytics for demonstration purposes</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">
              2. Use of Information
            </h2>
            <p className="mb-4">The information collected is used solely to:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Demonstrate user authentication features</li>
              <li>Showcase personalization capabilities</li>
              <li>Improve the educational demonstration</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">
              3. Third-Party Services
            </h2>
            <p className="mb-4">
              Our demonstration interfaces with third-party APIs. We do not
              control and are not responsible for their privacy practices. Users
              should review the privacy policies of these services.
            </p>
            <h2 className="mb-3 text-2xl font-semibold">4. Data Storage</h2>
            <p className="mb-4">
              Most user preferences and watch history are stored locally in your
              browser. Any server-side data may be deleted at any time as this
              is a demonstration project.
            </p>
            <h2 className="mb-3 text-2xl font-semibold">5. Data Security</h2>
            <p className="mb-4">
              While we implement reasonable security measures, this is an
              educational demonstration and should not be used for sensitive
              information.
            </p>
            <h2 className="mb-3 text-2xl font-semibold">6. Your Rights</h2>
            <p className="mb-4">You can:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Access your stored information</li>
              <li>Delete your account and associated data</li>
              <li>Clear local storage and cookies</li>
            </ul>
            <h2 className="mb-3 text-2xl font-semibold">
              7. Children's Privacy
            </h2>
            <p className="mb-4">
              This educational demonstration is not intended for children under
              13. We do not knowingly collect information from children under
              13.
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

export default PrivacyPolicy;
