"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Users,
  Shield,
  Globe,
  Sparkles,
  HandHeart,
  Store,
  Award,
  Target,
  Eye,
} from "lucide-react";

const values = [
  {
    icon: HandHeart,
    title: "Handcrafted with Love",
    description:
      "Every product on our platform is made by hand with care and attention to detail by talented artisans.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We believe in building a supportive community where makers can thrive and customers find unique treasures.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "We ensure secure transactions, verified sellers, and honest product representations.",
  },
  {
    icon: Globe,
    title: "Local Artisans, Global Reach",
    description:
      "Connecting UAE's finest craftspeople with customers worldwide who appreciate authentic handmade goods.",
  },
];

const stats = [
  { label: "Artisan Sellers", value: "500+" },
  { label: "Handmade Products", value: "10,000+" },
  { label: "Happy Customers", value: "25,000+" },
  { label: "UAE Cities Covered", value: "7" },
];

const team = [
  {
    name: "Our Mission",
    icon: Target,
    description:
      "To empower local artisans and makers in the UAE by providing them with a platform to showcase their handcrafted creations, while offering customers access to unique, high-quality products made with passion and care.",
  },
  {
    name: "Our Vision",
    icon: Eye,
    description:
      "To become the leading marketplace for handmade goods in the Middle East, fostering a thriving ecosystem where traditional craftsmanship meets modern commerce, and where every purchase supports a local artisan's dream.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-amber-50/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-transparent to-amber-100/40" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-6">
              About Handmade Love Filled
            </h1>
            <p className="text-lg text-amber-800/80 max-w-3xl mx-auto leading-relaxed">
              We are a UAE-based marketplace dedicated to celebrating the art of handmade.
              Our platform connects talented local artisans with customers who appreciate
              the beauty, quality, and uniqueness of handcrafted products.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-amber-900 mb-6">
                Where Passion Meets Craftsmanship
              </h2>
              <div className="space-y-4 text-amber-800/80 leading-relaxed">
                <p>
                  Handmade Love Filled was born from a simple belief: that handcrafted
                  products carry a piece of their maker's soul. In a world of mass
                  production, we wanted to create a space where artisans could share
                  their unique creations with people who truly value them.
                </p>
                <p>
                  Based in the United Arab Emirates, we've built a platform that
                  celebrates the rich tradition of craftsmanship while embracing modern
                  technology. From intricate jewelry to handwoven textiles, from artisan
                  foods to custom home décor – every item on our marketplace tells a story.
                </p>
                <p>
                  When you shop with us, you're not just buying a product – you're
                  supporting a local artisan, preserving traditional skills, and owning
                  something truly one-of-a-kind.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-rose-200 via-amber-100 to-orange-200 p-8 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-20 w-20 text-amber-700 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-amber-900">Made with Love</p>
                  <p className="text-amber-700">in the UAE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {team.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-rose-100 bg-white/80 p-8 hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-amber-500 text-white mb-6">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-4">{item.name}</h3>
                <p className="text-amber-800/80 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-amber-900 mb-4">Our Values</h2>
            <p className="text-amber-800/70 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-rose-100 bg-white/80 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-amber-900 mb-2">{value.title}</h3>
                <p className="text-sm text-amber-800/70">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-rose-100/50 via-amber-50 to-orange-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-amber-900 mb-2">{stat.value}</div>
                <div className="text-amber-700">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-amber-900 mb-4">Why Choose Us?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-6">
              <Store className="h-10 w-10 text-rose-500 mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Verified Artisans</h3>
              <p className="text-amber-800/70">
                Every seller on our platform is verified to ensure authenticity and quality.
                We personally review each application to maintain our high standards.
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-6">
              <Shield className="h-10 w-10 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Secure Payments</h3>
              <p className="text-amber-800/70">
                Shop with confidence using our secure payment system powered by Stripe.
                Your transactions are protected with industry-leading security.
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-6">
              <Award className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Quality Guarantee</h3>
              <p className="text-amber-800/70">
                We stand behind every product sold on our platform. If you're not satisfied,
                our customer support team is here to help make it right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-rose-500 to-amber-500 p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Whether you're a maker looking to share your craft or a customer seeking
              unique handmade treasures, we'd love to have you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/become-a-seller"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-amber-900 font-semibold hover:bg-white/90 transition-colors"
              >
                <Store className="h-5 w-5" />
                Start Selling
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors border border-white/30"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-800/80 mb-4">
            Have questions? We'd love to hear from you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold"
          >
            Get in Touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
