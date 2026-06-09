import Link from "next/link";
import { Facebook, MessageCircle, Instagram } from "lucide-react";

interface FooterProps {
  locale: string;
  messages: any;
  logoUrl?: string | null;
}

export default function Footer({ locale, messages, logoUrl }: FooterProps) {
  return (
    <footer className="bg-[#112240]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="บ้านดี คอนโดดี" className="h-16 mb-4" />
            )}
            <p className="text-sm text-gray-400 leading-relaxed">
              Your lens into the world of real estate. We connect you to your next home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${locale}/properties?listingType=RENT`} className="text-gray-400 hover:text-white transition-colors">Rent</Link></li>
              <li><Link href={`/${locale}/properties?listingType=SALE`} className="text-gray-400 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href={`/${locale}/portfolio`} className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${locale}/contact`} className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Subscribe to our Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Get the latest properties and deals straight to your inbox.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 outline-none focus:border-[#C8A951]"
              />
              <button
                className="px-4 py-2 bg-[#C8A951] text-white rounded-lg text-sm font-medium hover:bg-[#B8993F] transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} บ้านดี คอนโดดี NPB Property
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
