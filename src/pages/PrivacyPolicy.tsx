import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" alt="Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate("/")}>PokéMarket</span>
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

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">1. Introduction</h2>
            <p>
              Welcome to PokéMarket ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Pokemon card market tracking service.
            </p>
            <p>
              By accessing or using PokéMarket, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold mt-4">2.1 Information You Provide</h3>
            <p>We may collect the following information that you voluntarily provide:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address (for account creation and authentication)</li>
              <li>Account credentials and authentication data (email OTP codes or encrypted passwords)</li>
              <li>Profile information (username, profile picture)</li>
              <li>User preferences (theme settings, notification preferences)</li>
              <li>Favorite cards and watchlist data</li>
              <li>Communication preferences</li>
              <li>Any information you provide when contacting our support team</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">2.2 Automatically Collected Information</h3>
            <p>When you use our service, we automatically collect certain information, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Usage data (pages viewed, features accessed, time spent on the service)</li>
              <li>IP address and general location information</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data and analytics information</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">2.3 Third-Party Data</h3>
            <p>
              We collect Pokemon card pricing and market data from third-party APIs (Pokemon TCG API and TCGPlayer) to provide our service. This includes card images, set information, rarity data, and market prices. This data is publicly available market information and does not contain personal user data. We track cards with market values above $3 from vintage to modern sets, with price updates every 10 minutes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide, maintain, and improve our service</li>
              <li>To create and manage your user account and profile</li>
              <li>To authenticate users via email OTP or password and prevent fraud</li>
              <li>To store and manage your favorite cards and watchlist</li>
              <li>To remember your preferences (theme, notification settings)</li>
              <li>To send you updates, notifications, and service-related communications</li>
              <li>To analyze usage patterns and optimize user experience</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To comply with legal obligations and enforce our terms</li>
              <li>To display relevant advertisements (if applicable)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">4. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            
            <h3 className="text-lg font-semibold mt-4">4.1 Service Providers</h3>
            <p>
              We may share information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Cloud hosting and database services (Convex)</li>
              <li>Authentication services</li>
              <li>Analytics providers</li>
              <li>Email service providers</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">4.2 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Legal processes (subpoenas, court orders)</li>
              <li>Government requests</li>
              <li>Protection of our rights, property, or safety</li>
              <li>Prevention of fraud or illegal activities</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">4.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device that help us:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Authenticate your account</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Provide personalized content</li>
            </ul>
            <p>
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication protocols</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p>
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. We will retain and use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain your account and user preferences</li>
              <li>Store your favorite cards and watchlist data</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p>
              Price history data is retained for up to 90 days for individual cards, with daily snapshots kept for up to one year. Redundant price history entries are automatically cleaned up weekly to optimize storage. When your personal information is no longer needed, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">8. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in Section 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">10. Third-Party Links and Services</h2>
            <p>
              Our service may contain links to third-party websites and services (such as TCGPlayer). We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
            <p>
              Third-party services we integrate with include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Pokemon TCG API (for card data)</li>
              <li>TCGPlayer (for pricing information and marketplace links)</li>
              <li>Convex (for backend and database services)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our service, you consent to the transfer of your information to these countries.
            </p>
            <p>
              We take appropriate measures to ensure that your personal information remains protected in accordance with this Privacy Policy when transferred internationally.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last updated" date at the top of this policy</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p>
              Your continued use of our service after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through the contact information provided on our website.
            </p>
            <p>
              We will respond to your inquiry within a reasonable timeframe and work to address your concerns.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">14. California Privacy Rights</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The right to know what personal information we collect, use, and disclose</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>The right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">15. European Privacy Rights (GDPR)</h2>
            <p>
              If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), including the rights outlined in Section 8, as well as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The right to lodge a complaint with a supervisory authority</li>
              <li>The right to data portability</li>
              <li>The right to object to automated decision-making</li>
            </ul>
            <p>
              Our legal basis for processing your personal information includes consent, contract performance, legal obligations, and legitimate interests.
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
