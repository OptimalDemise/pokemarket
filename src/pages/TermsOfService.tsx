import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/c700910b-f565-4be6-8e57-cfe8aef67ead" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">PokéMarket</span>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PokéMarket ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">2. Description of Service</h2>
            <p>
              PokéMarket provides real-time market tracking for Pokemon trading cards and sealed products. The Service displays price information, historical trends, and market data sourced from third-party APIs and public marketplaces.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">3. Data Accuracy and Disclaimer</h2>
            <p>
              While we strive to provide accurate and up-to-date information, PokéMarket does not guarantee the accuracy, completeness, or reliability of any price data or market information displayed on the Service. All data is provided "as is" without warranty of any kind.
            </p>
            <p>
              Price information is sourced from third-party APIs and marketplaces. We are not responsible for any errors, omissions, or delays in this information or any losses arising from its use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">4. No Financial Advice</h2>
            <p>
              The information provided on PokéMarket is for informational purposes only and should not be construed as financial, investment, or trading advice. Users should conduct their own research and consult with qualified professionals before making any purchasing or investment decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">5. User Accounts</h2>
            <p>
              Users may create accounts to access the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Scrape, crawl, or use automated tools to access the Service without permission</li>
              <li>Reproduce, duplicate, or copy any part of the Service without authorization</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">7. Intellectual Property</h2>
            <p>
              All content, trademarks, and data on PokéMarket, including but not limited to software, databases, text, graphics, icons, and logos, are the property of PokéMarket or its content suppliers and are protected by intellectual property laws.
            </p>
            <p>
              Pokemon card images and related trademarks are property of The Pokemon Company, Nintendo, Game Freak, and Creatures Inc. We do not claim ownership of any Pokemon-related intellectual property.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">8. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services (such as TCGPlayer) that are not owned or controlled by PokéMarket. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PokéMarket shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">10. Data Collection and Privacy</h2>
            <p>
              We collect and process user data in accordance with our Privacy Policy. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">11. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that PokéMarket shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">12. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">13. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms of Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">14. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which PokéMarket operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the contact information provided on our website.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 PokéMarket. Built for collectors and investors.</p>
        </div>
      </footer>
    </div>
  );
}
