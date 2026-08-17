"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  HelpCircle,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

const contactReasons = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Issue" },
  { value: "seller", label: "Seller Support" },
  { value: "payment", label: "Payment Question" },
  { value: "technical", label: "Technical Issue" },
  { value: "partnership", label: "Partnership/Business" },
  { value: "feedback", label: "Feedback/Suggestion" },
  { value: "other", label: "Other" },
];

const quickLinks = [
  {
    icon: HelpCircle,
    title: "Help Center",
    description: "Find answers to common questions",
    href: "/seller-guide",
    color: "bg-blue-500",
  },
  {
    icon: ShoppingBag,
    title: "Seller Support",
    description: "Help for vendors and artisans",
    href: "/dashboard/help",
    color: "bg-emerald-500",
  },
  {
    icon: CreditCard,
    title: "Payment Issues",
    description: "Questions about payments & refunds",
    href: "/dashboard/settings/payments",
    color: "bg-purple-500",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "general",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Simulate form submission - replace with actual API call
    try {
      // In production, send to your API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        reason: "general",
        orderNumber: "",
        subject: "",
        message: "",
      });
    } catch {
      setStatus("error");
      setErrorMessage("Failed to send message. Please try again or email us directly.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-amber-50/30">
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-br from-rose-100/40 via-transparent to-amber-100/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
            <MessageSquare className="h-4 w-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Contact Us</h1>
          <p className="text-lg text-amber-800/70 max-w-2xl mx-auto">
            Have a question, feedback, or need assistance? We're here to help.
            Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="group rounded-2xl border border-rose-100 bg-white/80 p-5 hover:shadow-md transition-all"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${link.color} text-white mb-3`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-amber-900 group-hover:text-rose-600 transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-amber-800/70 mt-1">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-rose-100 bg-white/80 p-6">
                <h2 className="text-xl font-bold text-amber-900 mb-6">Contact Information</h2>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">Email</p>
                      <a
                        href="mailto:support@handmadelovefilled.com"
                        className="text-rose-600 hover:underline"
                      >
                        support@handmadelovefilled.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">Phone</p>
                      <a href="tel:+97142345678" className="text-amber-800/80 hover:text-rose-600">
                        +971 4 234 5678
                      </a>
                      <p className="text-sm text-amber-800/60">Sun - Thu, 9am - 6pm GST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">Address</p>
                      <p className="text-amber-800/80">
                        Handmade Love Filled LLC
                        <br />
                        Dubai, United Arab Emirates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">Business Hours</p>
                      <p className="text-amber-800/80">
                        Sunday - Thursday: 9:00 AM - 6:00 PM
                        <br />
                        Friday - Saturday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 p-6">
                <h3 className="font-semibold text-amber-900 mb-2">Expected Response Time</h3>
                <p className="text-amber-800/80 text-sm">
                  We typically respond to inquiries within 24-48 business hours. For urgent
                  order issues, please include your order number in the subject line.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-rose-100 bg-white/80 p-6 md:p-8">
                <h2 className="text-xl font-bold text-amber-900 mb-6">Send Us a Message</h2>

                {status === "success" ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-amber-900 mb-2">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-amber-800/70 mb-6">
                      Thank you for contacting us. We'll get back to you within 24-48 business hours.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-6 py-2 rounded-full bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {status === "error" && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700">{errorMessage}</p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-amber-900 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900 placeholder-amber-400"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-amber-900 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900 placeholder-amber-400"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-amber-900 mb-2">
                          Reason for Contact *
                        </label>
                        <select
                          id="reason"
                          name="reason"
                          value={formData.reason}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900"
                        >
                          {contactReasons.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="orderNumber" className="block text-sm font-medium text-amber-900 mb-2">
                          Order Number (if applicable)
                        </label>
                        <input
                          type="text"
                          id="orderNumber"
                          name="orderNumber"
                          value={formData.orderNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900 placeholder-amber-400"
                          placeholder="ORD-XXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-amber-900 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900 placeholder-amber-400"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-amber-900 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-amber-900 placeholder-amber-400 resize-none"
                        placeholder="Please describe your inquiry in detail..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-amber-800/60">* Required fields</p>
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold hover:from-rose-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-12 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-800/80 mb-4">
            Looking for quick answers? Check our frequently asked questions.
          </p>
          <Link
            href="/seller-guide#faq"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold"
          >
            <HelpCircle className="h-5 w-5" />
            View FAQ →
          </Link>
        </div>
      </section>
    </div>
  );
}
