"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Database, Globe, Mail, AlertCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 2024";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-amber-50/30">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-br from-rose-100/40 via-transparent to-amber-100/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Your Privacy Matters
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Privacy Policy</h1>
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
                <Lock className="h-6 w-6 text-rose-500" />
                Introduction
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Welcome to Handmade Love Filled ("we," "our," or "us"). We are committed to
                  protecting your privacy and ensuring the security of your personal information.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you visit our website and use our services.
                </p>
                <p>
                  Handmade Love Filled is operated in compliance with the laws of the United Arab
                  Emirates, including the UAE Federal Decree-Law No. 45 of 2021 on Personal Data
                  Protection and applicable regulations issued by the UAE Data Office.
                </p>
              </div>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-rose-500" />
                Information We Collect
              </h2>
              <div className="space-y-6 text-amber-800/80 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Personal Information</h3>
                  <p className="mb-3">We may collect personal information that you voluntarily provide, including:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Billing and shipping addresses</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Account credentials (username, password)</li>
                    <li>Business information (for sellers: trade license, Emirates ID)</li>
                    <li>Profile information (profile picture, bio, shop description)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Automatically Collected Information</h3>
                  <p className="mb-3">When you access our platform, we automatically collect:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and approximate location</li>
                    <li>Pages visited and time spent on each page</li>
                    <li>Referring website or source</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Eye className="h-6 w-6 text-rose-500" />
                How We Use Your Information
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process transactions and fulfill orders</li>
                  <li>Create and manage your account</li>
                  <li>Verify seller identities and business credentials</li>
                  <li>Send transactional emails (order confirmations, shipping updates)</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Improve our platform and user experience</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-rose-500" />
                Information Sharing & Disclosure
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Sellers:</strong> When you make a purchase, we share necessary information
                    (name, shipping address) with the seller to fulfill your order.
                  </li>
                  <li>
                    <strong>Payment Processors:</strong> We use Stripe to process payments. Your
                    payment information is handled directly by Stripe in accordance with their
                    privacy policy.
                  </li>
                  <li>
                    <strong>Service Providers:</strong> Third-party services that help us operate
                    our platform (hosting, email delivery, analytics).
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by UAE law or to protect
                    our legal rights.
                  </li>
                </ul>
                <p className="mt-4">
                  We do not sell your personal information to third parties for marketing purposes.
                </p>
              </div>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Data Security</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We implement appropriate technical and organizational measures to protect your
                  personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL/TLS encryption for data in transit</li>
                  <li>Secure password hashing</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Secure payment processing through Stripe</li>
                </ul>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Data Retention</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We retain your personal information for as long as necessary to fulfill the
                  purposes outlined in this policy, unless a longer retention period is required
                  by UAE law. Specifically:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information: Until you delete your account</li>
                  <li>Transaction records: 7 years (as required by UAE tax regulations)</li>
                  <li>Marketing preferences: Until you withdraw consent</li>
                </ul>
              </div>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Your Rights</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>Under UAE data protection law, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Withdraw consent for marketing communications</li>
                  <li>Object to certain processing of your information</li>
                  <li>Request data portability</li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, please contact us at{" "}
                  <a href="mailto:privacy@handmadelovefilled.com" className="text-rose-600 hover:underline">
                    privacy@handmadelovefilled.com
                  </a>
                </p>
              </div>
            </div>

            {/* International Transfers */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">International Data Transfers</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Some of our service providers may be located outside the UAE. When we transfer
                  your data internationally, we ensure appropriate safeguards are in place in
                  compliance with UAE data protection requirements.
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Children's Privacy</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Our platform is not intended for children under 18 years of age. We do not
                  knowingly collect personal information from children. If you believe we have
                  collected information from a child, please contact us immediately.
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any
                  material changes by posting the new policy on this page and updating the "Last
                  updated" date. We encourage you to review this policy periodically.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl bg-rose-50 p-6">
              <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Mail className="h-5 w-5 text-rose-500" />
                Contact Us
              </h2>
              <div className="text-amber-800/80 space-y-2">
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@handmadelovefilled.com" className="text-rose-600 hover:underline">
                    privacy@handmadelovefilled.com
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> Handmade Love Filled, Dubai, United Arab Emirates
                </p>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/terms"
              className="px-6 py-2 rounded-full bg-white border border-rose-200 text-amber-900 hover:bg-rose-50 transition-colors"
            >
              Terms of Service
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
