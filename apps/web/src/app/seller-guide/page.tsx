import Link from "next/link";
import {
  Store,
  CreditCard,
  Package,
  Truck,
  BarChart3,
  Shield,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Wallet,
  FileText,
  Users,
  Bell,
  Settings,
  Globe,
} from "lucide-react";

export const metadata = {
  title: "Seller Guide | Handmade Love Filled",
  description: "Complete guide to selling on Handmade Love Filled marketplace. Learn how to set up your shop, list products, manage orders, and receive payments.",
};

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up with your email or Google account to get started.",
    details: [
      "Visit the registration page or click 'Become a Seller'",
      "Enter your email address and create a secure password (min. 8 characters)",
      "Or use Google Sign-In for faster registration",
      "Verify your email address through the confirmation link",
    ],
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Complete Business Information",
    description: "Provide your business details for verification.",
    details: [
      "Enter your legal business name or personal name if sole proprietor",
      "Select your country of operation",
      "Add your business address (optional but recommended)",
      "Provide a contact phone number for support purposes",
    ],
    icon: FileText,
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    title: "Upload Verification Documents",
    description: "Submit required documents for identity verification.",
    details: [
      "Upload a valid government-issued ID (passport, driver's license)",
      "Provide business registration documents if applicable",
      "Tax registration certificate (VAT/GST if applicable)",
      "Documents are securely stored and reviewed by our team",
    ],
    icon: Shield,
    color: "from-emerald-500 to-teal-500",
  },
  {
    number: "04",
    title: "Set Up Your Shop",
    description: "Create your storefront with a unique name and description.",
    details: [
      "Choose a memorable shop name that represents your brand",
      "Write a compelling description of what you sell",
      "Add a cover image to make your shop stand out",
      "Your shop URL will be: handmadelovefilled.com/shop/your-shop-name",
    ],
    icon: Store,
    color: "from-amber-500 to-orange-500",
  },
  {
    number: "05",
    title: "Connect Stripe for Payments",
    description: "Link your bank account to receive payouts.",
    details: [
      "Go to Dashboard → Settings → Payments",
      "Click 'Connect with Stripe' to start the OAuth flow",
      "Follow Stripe's onboarding to verify your identity",
      "Add your bank account details for receiving payouts",
      "Once connected, you'll receive automatic transfers after each sale",
    ],
    icon: CreditCard,
    color: "from-indigo-500 to-violet-500",
  },
  {
    number: "06",
    title: "Add Your Products",
    description: "List your handmade items with photos and descriptions.",
    details: [
      "Go to Dashboard → Products → New Product",
      "Upload high-quality photos (multiple angles recommended)",
      "Write detailed titles and descriptions",
      "Set your price, stock quantity, and shipping options",
      "Add product variants (size, color) if applicable",
      "Publish when ready or save as draft to edit later",
    ],
    icon: Package,
    color: "from-rose-500 to-red-500",
  },
];

const features = [
  {
    title: "Order Management",
    description: "Track and manage all your orders from one dashboard. Update order status, print shipping labels, and communicate with customers.",
    icon: Truck,
    link: "/dashboard/orders",
  },
  {
    title: "Analytics & Insights",
    description: "Monitor your shop performance with detailed analytics. Track sales, revenue, popular products, and customer demographics.",
    icon: BarChart3,
    link: "/dashboard/analytics",
  },
  {
    title: "Earnings & Payouts",
    description: "View your earnings breakdown, platform fees, and payout history. Transfers are automatic after successful orders.",
    icon: Wallet,
    link: "/dashboard/earnings",
  },
  {
    title: "Notifications",
    description: "Stay updated with real-time notifications for new orders, messages, reviews, and important updates.",
    icon: Bell,
    link: "/dashboard/notifications",
  },
  {
    title: "Shop Settings",
    description: "Customize your shop appearance, update business information, and manage your payment settings.",
    icon: Settings,
    link: "/dashboard/shop",
  },
  {
    title: "Global Reach",
    description: "Sell to customers worldwide. We handle currency conversion and provide international shipping options.",
    icon: Globe,
    link: "/dashboard",
  },
];

const faqs = [
  {
    question: "How long does the approval process take?",
    answer: "Most applications are reviewed within 24-48 hours. You'll receive an email notification once your shop is approved.",
  },
  {
    question: "What are the platform fees?",
    answer: "We charge a small commission on each sale (typically 10-15%). This covers payment processing, platform maintenance, and customer support.",
  },
  {
    question: "When do I receive my payouts?",
    answer: "Payouts are processed automatically through Stripe. Depending on your country and Stripe settings, funds typically arrive within 2-7 business days after a sale.",
  },
  {
    question: "What products can I sell?",
    answer: "We focus on handmade, artisan, and unique products. Mass-produced items, prohibited goods, and items violating our policies are not allowed.",
  },
  {
    question: "How do I handle shipping?",
    answer: "You're responsible for shipping products to customers. Set your own shipping rates and methods in your product listings.",
  },
  {
    question: "What if a customer wants a refund?",
    answer: "Handle refund requests through the order management system. Communicate with customers to resolve issues. Refunds are processed back to the original payment method.",
  },
];

export default function SellerGuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-rose-700 mb-6">
              <HelpCircle className="h-4 w-4" />
              Complete Seller Guide
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-amber-900 sm:text-5xl lg:text-6xl">
              Start Selling Your <span className="text-rose-500">Handmade</span> Creations
            </h1>
            <p className="mt-6 text-lg text-amber-800/80 max-w-2xl mx-auto">
              Everything you need to know about setting up your shop, listing products, managing orders, and receiving payments on Handmade Love Filled.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/become-a-seller"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-amber-600 transition-all"
              >
                Start Selling Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-8 py-3 text-base font-semibold text-rose-700 hover:bg-rose-50 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold text-amber-900 sm:text-4xl">
              Getting Started in 6 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-amber-800/70">
              Follow this step-by-step guide to set up your shop and start selling.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative rounded-3xl border border-rose-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Step Number & Icon */}
                  <div className="flex-shrink-0 flex items-start gap-4">
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="lg:hidden">
                      <span className="text-sm font-bold text-rose-500">Step {step.number}</span>
                      <h3 className="text-xl font-bold text-amber-900">{step.title}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="hidden lg:block mb-4">
                      <span className="text-sm font-bold text-rose-500">Step {step.number}</span>
                      <h3 className="text-2xl font-bold text-amber-900">{step.title}</h3>
                    </div>
                    <p className="text-amber-800/80 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-amber-800/70">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[4.5rem] top-full h-8 w-0.5 bg-gradient-to-b from-rose-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold text-amber-900 sm:text-4xl">
              Powerful Seller Tools
            </h2>
            <p className="mt-4 text-lg text-amber-800/70">
              Everything you need to manage and grow your business.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.link}
                className="group relative rounded-2xl border border-rose-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-rose-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 group-hover:text-rose-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-amber-800/70">{feature.description}</p>
                  </div>
                </div>
                <ArrowRight className="absolute right-6 top-6 h-5 w-5 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stripe Setup Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-indigo-100 bg-white p-8 lg:p-12 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Setting Up Stripe Payments</h2>
                  <p className="text-gray-600">Receive secure payments from customers worldwide</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-indigo-50 p-6">
                  <h3 className="font-semibold text-indigo-900 mb-4">How Payment Processing Works</h3>
                  <div className="space-y-3 text-sm text-indigo-800">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">1</span>
                      <p>Customer purchases your product and pays through our secure checkout</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">2</span>
                      <p>Payment is processed by Stripe and held securely</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">3</span>
                      <p>Platform fee is deducted automatically (displayed in your dashboard)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">4</span>
                      <p>Your earnings are transferred to your connected Stripe account</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">5</span>
                      <p>Stripe pays out to your bank account based on your payout schedule</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Supported Countries</h4>
                    <p className="text-sm text-gray-600">
                      Stripe supports sellers in 45+ countries including UAE, US, UK, EU, and more.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Payout Currencies</h4>
                    <p className="text-sm text-gray-600">
                      Receive payouts in your local currency (AED, USD, EUR, GBP, and 100+ more).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/dashboard/settings/payments"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Wallet className="h-5 w-5" />
                    Connect Stripe Account
                  </Link>
                  <a
                    href="https://stripe.com/connect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Learn More About Stripe Connect
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold text-amber-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-amber-800/70">
              Common questions about selling on our platform.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-rose-100 bg-white p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <h3 className="font-semibold text-amber-900">{faq.question}</h3>
                  <span className="relative h-5 w-5 flex-shrink-0">
                    <svg
                      className="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                    <svg
                      className="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-amber-800/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-500 to-amber-500">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Selling?
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Join thousands of artisans and creators selling their handmade products on our marketplace.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/become-a-seller"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-rose-600 shadow-lg hover:bg-rose-50 transition-all"
            >
              Create Your Shop
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:support@handmadelovefilled.com"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/50 px-8 py-3 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
