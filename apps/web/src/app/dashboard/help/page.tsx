"use client";

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
  Bell,
  Settings,
  Image,
  Tag,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

const quickLinks = [
  {
    title: "Add New Product",
    description: "List a new handmade item for sale",
    href: "/dashboard/products/new",
    icon: Package,
    color: "bg-emerald-500",
  },
  {
    title: "View Orders",
    description: "Manage and track customer orders",
    href: "/dashboard/orders",
    icon: Truck,
    color: "bg-blue-500",
  },
  {
    title: "Check Earnings",
    description: "View your revenue and payouts",
    href: "/dashboard/earnings",
    icon: DollarSign,
    color: "bg-amber-500",
  },
  {
    title: "Payment Settings",
    description: "Connect or manage Stripe account",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
    color: "bg-purple-500",
  },
];

const guides = [
  {
    title: "Setting Up Your Shop",
    items: [
      {
        title: "Complete Your Profile",
        description: "Add your business name, contact details, and upload verification documents.",
        link: "/dashboard/onboarding",
      },
      {
        title: "Customize Shop Appearance",
        description: "Add a cover image and description to make your shop stand out.",
        link: "/dashboard/shop/appearance",
      },
      {
        title: "Connect Stripe Account",
        description: "Link your bank account to receive payments from customers.",
        link: "/dashboard/settings/payments",
      },
    ],
  },
  {
    title: "Managing Products",
    items: [
      {
        title: "Create a Product Listing",
        description: "Add photos, title, description, price, and stock quantity.",
        link: "/dashboard/products/new",
      },
      {
        title: "Add Product Variants",
        description: "Set up size, color, or other options for your products.",
        link: "/dashboard/products",
      },
      {
        title: "Manage Inventory",
        description: "Track stock levels and get alerts for low inventory.",
        link: "/dashboard/products",
      },
      {
        title: "Create Discount Codes",
        description: "Offer promotions and discounts to attract customers.",
        link: "/dashboard/discount-codes",
      },
    ],
  },
  {
    title: "Orders & Shipping",
    items: [
      {
        title: "Process New Orders",
        description: "View order details, customer info, and shipping address.",
        link: "/dashboard/orders",
      },
      {
        title: "Update Order Status",
        description: "Mark orders as shipped, delivered, or handle cancellations.",
        link: "/dashboard/orders",
      },
      {
        title: "Handle Refunds",
        description: "Process refund requests through your dashboard.",
        link: "/dashboard/orders",
      },
    ],
  },
  {
    title: "Payments & Earnings",
    items: [
      {
        title: "View Earnings Dashboard",
        description: "Track your sales, platform fees, and net earnings.",
        link: "/dashboard/earnings",
      },
      {
        title: "Understand Platform Fees",
        description: "Platform takes a percentage of each sale for payment processing and services.",
        link: "/dashboard/earnings",
      },
      {
        title: "Stripe Payouts",
        description: "Earnings are automatically transferred to your bank via Stripe.",
        link: "/dashboard/settings/payments",
      },
    ],
  },
];

const stripeSteps = [
  {
    step: 1,
    title: "Go to Payment Settings",
    description: "Navigate to Dashboard → Settings → Payments",
  },
  {
    step: 2,
    title: "Click 'Connect with Stripe'",
    description: "This will redirect you to Stripe's secure onboarding flow",
  },
  {
    step: 3,
    title: "Complete Stripe Verification",
    description: "Provide your identity documents and business information to Stripe",
  },
  {
    step: 4,
    title: "Add Bank Account",
    description: "Enter your bank account details where you want to receive payouts",
  },
  {
    step: 5,
    title: "Start Receiving Payments",
    description: "Once connected, you'll automatically receive payouts after each sale",
  },
];

const troubleshooting = [
  {
    question: "Why can't I add products?",
    answer: "Make sure your shop is approved and your Stripe account is connected. Check Dashboard → Onboarding for any pending steps.",
  },
  {
    question: "Why isn't my shop visible?",
    answer: "Your shop needs to be approved by admin first. Check your application status in Dashboard → Onboarding.",
  },
  {
    question: "When will I receive my payout?",
    answer: "Payouts are processed through Stripe. Depending on your country and Stripe settings, funds arrive within 2-7 business days after a sale.",
  },
  {
    question: "How do I update my bank account?",
    answer: "Go to Dashboard → Settings → Payments → 'Open Stripe Dashboard' to update your payout settings directly in Stripe.",
  },
  {
    question: "What documents do I need to verify?",
    answer: "Typically a government ID (passport, driver's license) and business registration documents if applicable. Stripe may request additional verification.",
  },
];

export default function VendorHelpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-blue-400" />
          Vendor Help Center
        </h1>
        <p className="text-zinc-400 mt-1">
          Everything you need to manage your shop successfully.
        </p>
      </div>

      {/* Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color} text-white mb-3`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
          </Link>
        ))}
      </section>

      {/* Full Seller Guide Link */}
      <Link
        href="/seller-guide"
        className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 hover:bg-blue-500/20 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Complete Seller Guide</h3>
            <p className="text-sm text-blue-200/70">
              Step-by-step guide to setting up your shop and starting sales
            </p>
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-blue-400" />
      </Link>

      {/* Stripe Setup Guide */}
      <section className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Setting Up Stripe Payments</h2>
            <p className="text-sm text-purple-200/70">Connect your bank account to receive payouts</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stripeSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white text-sm font-bold mb-3">
                {step.step}
              </div>
              <h4 className="font-medium text-white text-sm">{step.title}</h4>
              <p className="text-xs text-zinc-400 mt-1">{step.description}</p>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/settings/payments"
          className="inline-flex items-center gap-2 mt-6 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
        >
          <Wallet className="h-4 w-4" />
          Go to Payment Settings
        </Link>
      </section>

      {/* Guides by Category */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">How-To Guides</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {guides.map((category) => (
            <div
              key={category.title}
              className="rounded-2xl border border-white/10 bg-black/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">{category.title}</h3>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.link}
                    className="group flex items-start gap-3 rounded-lg p-3 hover:bg-white/5 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-zinc-400">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Troubleshooting</h2>
        </div>

        <div className="space-y-4">
          {troubleshooting.map((item, index) => (
            <details
              key={index}
              className="group rounded-xl border border-white/10 bg-black/20 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4">
                <span className="font-medium text-white">{item.question}</span>
                <span className="ml-4 flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-zinc-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm text-zinc-400">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <MessageSquare className="h-10 w-10 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white">Need More Help?</h3>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Can't find what you're looking for? Contact our support team and we'll help you out.
        </p>
        <a
          href="mailto:support@handmadelovefilled.com"
          className="inline-flex items-center gap-2 mt-4 rounded-lg bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          Contact Support
        </a>
      </section>
    </div>
  );
}
