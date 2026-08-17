"use client";

import Link from "next/link";
import { Cookie, Settings, BarChart3, Shield, Target, Clock, ToggleLeft } from "lucide-react";

const cookieTypes = [
  {
    name: "Essential Cookies",
    icon: Shield,
    required: true,
    description:
      "These cookies are necessary for the website to function properly. They enable core functionality such as security, account authentication, and remembering your preferences. You cannot disable these cookies.",
    examples: [
      "Session cookies to keep you logged in",
      "Security cookies to prevent fraud",
      "Cart cookies to remember your shopping cart",
      "Cookie consent preferences",
    ],
  },
  {
    name: "Functional Cookies",
    icon: Settings,
    required: false,
    description:
      "These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we use. If you disable these cookies, some features may not work properly.",
    examples: [
      "Language and currency preferences",
      "Recently viewed products",
      "Saved searches and filters",
      "Video and media playback settings",
    ],
  },
  {
    name: "Analytics Cookies",
    icon: BarChart3,
    required: false,
    description:
      "These cookies help us understand how visitors interact with our website. They collect information about page visits, traffic sources, and user behavior to help us improve our platform.",
    examples: [
      "Google Analytics for traffic analysis",
      "Page view and session tracking",
      "Error and performance monitoring",
      "A/B testing cookies",
    ],
  },
  {
    name: "Marketing Cookies",
    icon: Target,
    required: false,
    description:
      "These cookies are used to track visitors across websites to display relevant advertisements. They help us measure the effectiveness of our marketing campaigns.",
    examples: [
      "Advertising platform cookies",
      "Social media tracking pixels",
      "Retargeting cookies",
      "Conversion tracking",
    ],
  },
];

const thirdPartyCookies = [
  {
    name: "Stripe",
    purpose: "Payment processing and fraud prevention",
    link: "https://stripe.com/privacy",
  },
  {
    name: "Google Analytics",
    purpose: "Website analytics and performance monitoring",
    link: "https://policies.google.com/privacy",
  },
];

export default function CookiePolicyPage() {
  const lastUpdated = "August 2024";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-amber-50/30">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-br from-rose-100/40 via-transparent to-amber-100/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
            <Cookie className="h-4 w-4" />
            Cookie Information
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Cookie Policy</h1>
          <p className="text-amber-800/70">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-rose-100 bg-white/80 p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">What Are Cookies?</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Cookies are small text files that are placed on your device when you visit a
                  website. They are widely used to make websites work more efficiently, provide
                  a better user experience, and give website owners information about how their
                  site is being used.
                </p>
                <p>
                  This Cookie Policy explains what cookies are, how Handmade Love Filled uses
                  cookies and similar technologies, and your choices regarding their use.
                </p>
              </div>
            </div>

            {/* How We Use Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">How We Use Cookies</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>We use cookies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keep you signed in to your account</li>
                  <li>Remember items in your shopping cart</li>
                  <li>Understand how you use our platform</li>
                  <li>Improve our services based on your interactions</li>
                  <li>Personalize your experience</li>
                  <li>Protect your account from fraud</li>
                  <li>Deliver relevant marketing (with your consent)</li>
                </ul>
              </div>
            </div>

            {/* Types of Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-6">Types of Cookies We Use</h2>
              <div className="space-y-6">
                {cookieTypes.map((type) => (
                  <div
                    key={type.name}
                    className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-400 to-amber-500 flex items-center justify-center text-white">
                          <type.icon className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-amber-900">{type.name}</h3>
                          {type.required ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-amber-800/80 mb-4">{type.description}</p>
                        <div>
                          <p className="text-sm font-medium text-amber-900 mb-2">Examples:</p>
                          <ul className="list-disc list-inside text-sm text-amber-800/70 space-y-1 ml-2">
                            {type.examples.map((example, index) => (
                              <li key={index}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Third-Party Cookies</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Some cookies on our platform are set by third-party services we use. These
                  services have their own privacy policies governing the use of cookies:
                </p>
                <div className="rounded-xl border border-rose-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-rose-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-amber-900 font-semibold">Service</th>
                        <th className="text-left px-4 py-3 text-amber-900 font-semibold">Purpose</th>
                        <th className="text-left px-4 py-3 text-amber-900 font-semibold">Privacy Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {thirdPartyCookies.map((cookie) => (
                        <tr key={cookie.name}>
                          <td className="px-4 py-3 font-medium text-amber-900">{cookie.name}</td>
                          <td className="px-4 py-3 text-amber-800/80">{cookie.purpose}</td>
                          <td className="px-4 py-3">
                            <a
                              href={cookie.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-rose-600 hover:underline"
                            >
                              View Policy
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Cookie Duration */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-rose-500" />
                Cookie Duration
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>Cookies can be either "session" or "persistent" cookies:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Session cookies:</strong> These are temporary and are deleted when you
                    close your browser. We use session cookies to maintain your shopping cart and
                    keep you logged in during your visit.
                  </li>
                  <li>
                    <strong>Persistent cookies:</strong> These remain on your device for a set
                    period or until you delete them. We use persistent cookies to remember your
                    preferences and provide a personalized experience when you return.
                  </li>
                </ul>
              </div>
            </div>

            {/* Managing Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
                <ToggleLeft className="h-6 w-6 text-rose-500" />
                Managing Your Cookie Preferences
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>You have several options for managing cookies:</p>

                <h3 className="text-lg font-semibold text-amber-900 mt-6 mb-2">Cookie Consent Banner</h3>
                <p>
                  When you first visit our website, you'll see a cookie consent banner. You can
                  accept all cookies, reject non-essential cookies, or customize your preferences.
                  You can change your preferences at any time by clicking the "Cookie Settings"
                  link in our website footer.
                </p>

                <h3 className="text-lg font-semibold text-amber-900 mt-6 mb-2">Browser Settings</h3>
                <p>
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete individual cookies or all cookies</li>
                  <li>Block third-party cookies</li>
                  <li>Block all cookies (note: this may affect website functionality)</li>
                  <li>Set your browser to notify you when cookies are being set</li>
                </ul>

                <p className="mt-4">
                  Here are links to cookie management guides for common browsers:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      Safari
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline"
                    >
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Impact of Disabling Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Impact of Disabling Cookies</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  If you disable cookies, some features of our website may not work properly.
                  Specifically:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You may not be able to stay logged in</li>
                  <li>Your shopping cart may not save items</li>
                  <li>Your preferences and settings may not be remembered</li>
                  <li>Some features may be unavailable or work differently</li>
                </ul>
                <p>
                  We recommend keeping essential cookies enabled for the best experience on
                  our platform.
                </p>
              </div>
            </div>

            {/* Updates */}
            <div>
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Updates to This Policy</h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our
                  practices or for other operational, legal, or regulatory reasons. We will post
                  any changes on this page and update the "Last updated" date.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl bg-rose-50 p-6">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Questions?</h2>
              <div className="text-amber-800/80 space-y-2">
                <p>If you have questions about our use of cookies, please contact us:</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@handmadelovefilled.com" className="text-rose-600 hover:underline">
                    privacy@handmadelovefilled.com
                  </a>
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
              href="/terms"
              className="px-6 py-2 rounded-full bg-white border border-rose-200 text-amber-900 hover:bg-rose-50 transition-colors"
            >
              Terms of Service
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
