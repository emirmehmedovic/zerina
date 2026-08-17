"use client";

import Link from "next/link";
import {
  Store,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Shield,
  HelpCircle,
  CheckCircle2,
  Wallet,
  FileText,
  Bell,
  Settings,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  UserPlus,
  ShoppingBag,
  Tag,
} from "lucide-react";

const quickLinks = [
  {
    title: "Vendor Applications",
    description: "Review and approve new vendor applications",
    href: "/admin/vendor-applications",
    icon: ClipboardList,
    color: "bg-amber-500",
  },
  {
    title: "Platform Earnings",
    description: "View revenue and commission breakdown",
    href: "/admin/earnings",
    icon: DollarSign,
    color: "bg-emerald-500",
  },
  {
    title: "Manage Shops",
    description: "Activate, suspend, or review shops",
    href: "/admin/shops",
    icon: Store,
    color: "bg-blue-500",
  },
  {
    title: "Create Admin",
    description: "Add new administrator accounts",
    href: "/admin/admins/new",
    icon: UserPlus,
    color: "bg-purple-500",
  },
];

const vendorApprovalSteps = [
  {
    step: 1,
    title: "Review Application",
    description: "Check vendor's business name, country, and contact information",
  },
  {
    step: 2,
    title: "Verify Documents",
    description: "Review uploaded ID and business registration documents",
  },
  {
    step: 3,
    title: "Check Identity Verification",
    description: "Ensure identity verification is complete (if required)",
  },
  {
    step: 4,
    title: "Approve or Reject",
    description: "Approve to activate the shop, or reject with a reason",
  },
  {
    step: 5,
    title: "Vendor Notified",
    description: "Vendor receives email notification of the decision",
  },
];

const guides = [
  {
    title: "Vendor Management",
    items: [
      {
        title: "Approve New Vendors",
        description: "Review applications, check documents, and approve or reject vendors.",
        link: "/admin/vendor-applications",
      },
      {
        title: "Manage Shop Status",
        description: "Activate, suspend, or close vendor shops as needed.",
        link: "/admin/shops",
      },
      {
        title: "View Vendor Details",
        description: "See shop products, orders, and performance metrics.",
        link: "/admin/shops",
      },
    ],
  },
  {
    title: "Platform Revenue",
    items: [
      {
        title: "View Platform Earnings",
        description: "Track total revenue, platform fees, and vendor payouts.",
        link: "/admin/earnings",
      },
      {
        title: "Revenue by Shop",
        description: "See earnings breakdown for each vendor shop.",
        link: "/admin/earnings",
      },
      {
        title: "Configure Platform Fee",
        description: "Set the commission percentage via STRIPE_PLATFORM_FEE_PERCENT environment variable.",
        link: "/admin/earnings",
      },
    ],
  },
  {
    title: "Product & Inventory",
    items: [
      {
        title: "View All Products",
        description: "Browse and search products across all vendor shops.",
        link: "/admin/inventory",
      },
      {
        title: "Create Products",
        description: "Add products directly to any shop as an admin.",
        link: "/admin/products/new",
      },
      {
        title: "Manage Categories",
        description: "Create and organize product categories.",
        link: "/admin/categories",
      },
    ],
  },
  {
    title: "Analytics & Reports",
    items: [
      {
        title: "Platform Analytics",
        description: "View overall marketplace performance and trends.",
        link: "/admin/analytics",
      },
      {
        title: "Sales Reports",
        description: "Track sales volume, order counts, and growth metrics.",
        link: "/admin/analytics",
      },
      {
        title: "Vendor Performance",
        description: "Compare vendor shops by revenue and order volume.",
        link: "/admin/earnings",
      },
    ],
  },
];

const paymentFlow = [
  {
    step: "Customer Payment",
    description: "Customer pays for products through checkout",
    icon: CreditCard,
  },
  {
    step: "Platform Receives",
    description: "Full payment goes to platform Stripe account",
    icon: Wallet,
  },
  {
    step: "Fee Deducted",
    description: "Platform commission is automatically retained",
    icon: DollarSign,
  },
  {
    step: "Vendor Transfer",
    description: "Remaining amount transferred to vendor's Stripe",
    icon: Store,
  },
  {
    step: "Vendor Payout",
    description: "Stripe pays vendor's bank per their schedule",
    icon: CreditCard,
  },
];

const troubleshooting = [
  {
    question: "Vendor can't connect Stripe - what should I check?",
    answer: "Ensure the vendor's shop is ACTIVE status. Vendors with PENDING_APPROVAL shops cannot connect Stripe. Approve their application first.",
  },
  {
    question: "How do I change the platform commission rate?",
    answer: "Set the STRIPE_PLATFORM_FEE_PERCENT environment variable (e.g., 15 for 15%). This applies to all new transactions.",
  },
  {
    question: "A vendor is not receiving payouts - why?",
    answer: "Check if their Stripe account is fully verified (chargesEnabled and payoutsEnabled must be true). They may need to complete Stripe's identity verification.",
  },
  {
    question: "How do I suspend a problematic shop?",
    answer: "Go to Admin → Shops, find the shop, and change status to SUSPENDED. This prevents new orders but preserves existing data.",
  },
  {
    question: "Can I refund a customer directly?",
    answer: "Refunds are processed through Stripe. Go to your Stripe Dashboard to issue refunds for specific charges.",
  },
  {
    question: "How do I promote a user to admin?",
    answer: "Go to Admin → Create Admin, enter the user's email address, and they will be promoted to ADMIN role.",
  },
];

export default function AdminHelpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-red-400" />
          Admin Help Center
        </h1>
        <p className="text-zinc-400 mt-1">
          Platform management guides and documentation.
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
            <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
          </Link>
        ))}
      </section>

      {/* Vendor Approval Process */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Vendor Approval Process</h2>
            <p className="text-sm text-amber-200/70">How to review and approve new vendor applications</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {vendorApprovalSteps.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold mb-3">
                {step.step}
              </div>
              <h4 className="font-medium text-white text-sm">{step.title}</h4>
              <p className="text-xs text-zinc-400 mt-1">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/10">
          <h4 className="font-medium text-white mb-2">When you approve a vendor:</h4>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              User role is upgraded to VENDOR
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Shop status changes from PENDING_APPROVAL to ACTIVE
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Vendor receives email and in-app notification
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Vendor can now connect Stripe and add products
            </li>
          </ul>
        </div>

        <Link
          href="/admin/vendor-applications"
          className="inline-flex items-center gap-2 mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Review Applications
        </Link>
      </section>

      {/* Payment Flow */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Payment & Revenue Flow</h2>
            <p className="text-sm text-emerald-200/70">How payments are processed and distributed</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4">
          {paymentFlow.map((item, index) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-medium text-white text-sm">{item.step}</h4>
                <p className="text-xs text-zinc-400 max-w-[140px]">{item.description}</p>
              </div>
              {index < paymentFlow.length - 1 && (
                <div className="hidden lg:block text-emerald-500 text-2xl">→</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-medium text-white mb-1">Platform Fee</h4>
            <p className="text-sm text-zinc-400">
              Set via <code className="text-emerald-400">STRIPE_PLATFORM_FEE_PERCENT</code> env variable
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-medium text-white mb-1">Stripe Connect</h4>
            <p className="text-sm text-zinc-400">
              Using Standard Connect with OAuth for vendor onboarding
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-medium text-white mb-1">Transfer Groups</h4>
            <p className="text-sm text-zinc-400">
              Payments grouped and transferred automatically after success
            </p>
          </div>
        </div>

        <Link
          href="/admin/earnings"
          className="inline-flex items-center gap-2 mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          View Platform Earnings
        </Link>
      </section>

      {/* Guides by Category */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Management Guides</h2>
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
                    <CheckCircle2 className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white group-hover:text-red-400 transition-colors">
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
      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
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

      {/* Environment Variables Reference */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Key Environment Variables</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 font-medium text-zinc-400">Variable</th>
                <th className="pb-3 font-medium text-zinc-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3"><code className="text-emerald-400">STRIPE_SECRET_KEY</code></td>
                <td className="py-3 text-zinc-400">Your Stripe secret API key</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-emerald-400">STRIPE_CLIENT_ID</code></td>
                <td className="py-3 text-zinc-400">Stripe Connect OAuth client ID</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-emerald-400">STRIPE_PLATFORM_FEE_PERCENT</code></td>
                <td className="py-3 text-zinc-400">Platform commission percentage (e.g., 15)</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-emerald-400">STRIPE_WEBHOOK_SECRET</code></td>
                <td className="py-3 text-zinc-400">Webhook signing secret for event verification</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-emerald-400">FRONTEND_URL</code></td>
                <td className="py-3 text-zinc-400">Frontend URL for email links and redirects</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
