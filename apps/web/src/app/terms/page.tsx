"use client";

import Link from "next/link";
import { FileText, Scale, ShoppingBag, CreditCard, Truck, AlertTriangle, Shield, Ban, Gavel } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "August 2024";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-amber-50/30">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-br from-rose-100/40 via-transparent to-amber-100/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            Legal Agreement
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Terms of Service</h1>
          <p className="text-amber-800/70">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-rose-100 bg-white/80 p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-rose-500" />
                Agreement to Terms
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Welcome to Handmade Love Filled. These Terms of Service ("Terms") govern your
                  access to and use of our website, mobile applications, and services (collectively,
                  the "Platform"). By accessing or using our Platform, you agree to be bound by
                  these Terms.
                </p>
                <p>
                  Handmade Love Filled is operated by Handmade Love Filled LLC, a company registered
                  in the United Arab Emirates. These Terms are governed by the laws of the UAE.
                </p>
                <p className="font-semibold">
                  If you do not agree to these Terms, please do not use our Platform.
                </p>
              </div>
            </div>

            {/* Definitions */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Definitions</h2>
              <div className="space-y-3 text-amber-800/80 leading-relaxed">
                <p><strong>"Buyer"</strong> refers to any user who purchases products through our Platform.</p>
                <p><strong>"Seller"</strong> or <strong>"Vendor"</strong> refers to any user who lists and sells products on our Platform.</p>
                <p><strong>"Products"</strong> refers to handmade goods listed for sale on our Platform.</p>
                <p><strong>"Services"</strong> refers to all features and functionalities provided by our Platform.</p>
              </div>
            </div>

            {/* Account Registration */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Account Registration</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>To use certain features of our Platform, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information as needed</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p>
                  You must be at least 18 years old to create an account. By creating an account,
                  you represent that you are at least 18 years of age.
                </p>
              </div>
            </div>

            {/* Seller Terms */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-rose-500" />
                Seller Terms
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>If you wish to sell on our Platform, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Complete our seller verification process</li>
                  <li>Provide valid UAE trade license or business documentation</li>
                  <li>Provide valid Emirates ID or passport for identity verification</li>
                  <li>Connect a valid Stripe account for payment processing</li>
                  <li>List only handmade, handcrafted, or artisan products</li>
                  <li>Provide accurate product descriptions and images</li>
                  <li>Maintain adequate inventory for listed products</li>
                  <li>Ship orders within the stated timeframe</li>
                  <li>Respond to customer inquiries promptly</li>
                </ul>

                <h3 className="text-lg font-semibold text-amber-900 mt-6 mb-2">Platform Fees</h3>
                <p>
                  We charge a platform fee on each successful transaction. The current fee structure
                  is displayed in your seller dashboard. Fees may be updated with 30 days notice.
                </p>

                <h3 className="text-lg font-semibold text-amber-900 mt-6 mb-2">Payouts</h3>
                <p>
                  Payments are processed through Stripe and transferred to your connected bank
                  account according to Stripe's payout schedule (typically 2-7 business days
                  depending on your location and account settings).
                </p>
              </div>
            </div>

            {/* Buyer Terms */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-rose-500" />
                Buyer Terms
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>When purchasing products on our Platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate shipping and billing information</li>
                  <li>Pay for all products and applicable fees</li>
                  <li>Review product descriptions carefully before purchasing</li>
                  <li>Understand that handmade products may have slight variations</li>
                  <li>Communicate respectfully with sellers</li>
                </ul>

                <h3 className="text-lg font-semibold text-amber-900 mt-6 mb-2">Payments</h3>
                <p>
                  All payments are processed securely through Stripe. We accept major credit cards,
                  debit cards, and other payment methods as displayed at checkout. All prices are
                  in AED unless otherwise specified.
                </p>
              </div>
            </div>

            {/* Shipping & Delivery */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Truck className="h-6 w-6 text-rose-500" />
                Shipping & Delivery
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Shipping is handled by individual sellers. Estimated delivery times and shipping
                  costs are displayed on each product listing. Sellers are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Packaging products securely</li>
                  <li>Shipping within the stated processing time</li>
                  <li>Providing tracking information when available</li>
                  <li>Ensuring products arrive in good condition</li>
                </ul>
                <p>
                  Handmade Love Filled is not responsible for shipping delays caused by carriers
                  or circumstances beyond the seller's control.
                </p>
              </div>
            </div>

            {/* Returns & Refunds */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Returns & Refunds</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Return and refund policies may vary by seller. Each seller's policy is displayed
                  on their shop page. Generally:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Custom or personalized items may not be returnable</li>
                  <li>Items must be returned in original condition</li>
                  <li>Buyers should contact sellers within 7 days of delivery for issues</li>
                  <li>Refunds are processed through the original payment method</li>
                </ul>
                <p>
                  If you cannot resolve an issue with a seller, please contact our support team
                  for assistance.
                </p>
              </div>
            </div>

            {/* Prohibited Items */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Ban className="h-6 w-6 text-rose-500" />
                Prohibited Items & Activities
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>The following items and activities are prohibited on our Platform:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mass-produced or factory-made items (not handmade)</li>
                  <li>Counterfeit or trademark-infringing products</li>
                  <li>Items that violate UAE law</li>
                  <li>Weapons, drugs, or controlled substances</li>
                  <li>Adult content or services</li>
                  <li>Hazardous materials</li>
                  <li>Stolen goods</li>
                  <li>Items that infringe intellectual property rights</li>
                  <li>Fraudulent listings or misrepresented products</li>
                  <li>Spam, harassment, or abusive behavior</li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-rose-500" />
                Intellectual Property
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  The Handmade Love Filled name, logo, and all related marks are trademarks of
                  Handmade Love Filled LLC. You may not use our trademarks without written permission.
                </p>
                <p>
                  Sellers retain ownership of their product designs and content. By listing on our
                  Platform, sellers grant us a license to display their products and promotional content.
                </p>
                <p>
                  If you believe content on our Platform infringes your intellectual property rights,
                  please contact us at{" "}
                  <a href="mailto:legal@handmadelovefilled.com" className="text-rose-600 hover:underline">
                    legal@handmadelovefilled.com
                  </a>
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
                Limitation of Liability
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Handmade Love Filled provides a platform connecting buyers and sellers. We are not
                  a party to transactions between users. To the maximum extent permitted by UAE law:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We do not guarantee the quality, safety, or legality of products</li>
                  <li>We are not responsible for seller or buyer conduct</li>
                  <li>We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>Our total liability is limited to fees paid to us in the 12 months prior to the claim</li>
                </ul>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Gavel className="h-6 w-6 text-rose-500" />
                Dispute Resolution
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Any disputes arising from these Terms or your use of our Platform shall be:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Governed by the laws of the United Arab Emirates</li>
                  <li>Subject to the exclusive jurisdiction of the courts of Dubai, UAE</li>
                  <li>First attempted to be resolved through good-faith negotiation</li>
                </ul>
              </div>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Termination</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We may suspend or terminate your account at any time for violation of these Terms
                  or for any other reason at our discretion. You may close your account at any time
                  by contacting us.
                </p>
                <p>
                  Upon termination, your right to use our Platform ceases immediately. Provisions
                  that by their nature should survive termination will remain in effect.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We may modify these Terms at any time. Material changes will be communicated via
                  email or Platform notification at least 30 days before taking effect. Continued
                  use of our Platform after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl bg-rose-50 p-6">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Contact Information</h2>
              <div className="text-amber-800/80 space-y-2">
                <p>For questions about these Terms, please contact us:</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:legal@handmadelovefilled.com" className="text-rose-600 hover:underline">
                    legal@handmadelovefilled.com
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> Handmade Love Filled LLC, Dubai, United Arab Emirates
                </p>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/privacy"
              className="px-6 py-2 rounded-full bg-white border border-rose-200 text-amber-900 hover:bg-rose-50 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="px-6 py-2 rounded-full bg-white border border-rose-200 text-amber-900 hover:bg-rose-50 transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/contact"
              className="px-6 py-2 rounded-full bg-white border border-rose-200 text-amber-900 hover:bg-rose-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
