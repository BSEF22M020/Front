import { Video, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-rich-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                Smart<span className="text-gradient">Meet</span>
              </span>
            </div>
            <p className="text-alice-white/80 mb-6 max-w-md leading-relaxed">
              Revolutionizing remote collaboration with intelligent meeting analytics, 
              automated insights, and seamless video conferencing for teams worldwide.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-royal-blue/20 rounded-full flex items-center justify-center hover:bg-royal-blue/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">f</span>
              </div>
              <div className="w-10 h-10 bg-royal-blue/20 rounded-full flex items-center justify-center hover:bg-royal-blue/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">t</span>
              </div>
              <div className="w-10 h-10 bg-royal-blue/20 rounded-full flex items-center justify-center hover:bg-royal-blue/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">in</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-alice-white">Product</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Features</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Pricing</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Security</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Integrations</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">API</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-alice-white">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">About</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Blog</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Careers</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Contact</a></li>
              <li><a href="#" className="text-alice-white/80 hover:text-royal-blue transition-colors">Press</a></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-alice-white/20">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-royal-blue" />
              <span className="text-alice-white/80">hello@smartmeet.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-royal-blue" />
              <span className="text-alice-white/80">+92-42-99231098</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-royal-blue" />
              <span className="text-alice-white/80">PUCIT, Lahore, Pakistan</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-alice-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-alice-white/60 text-sm">
            © 2024 SmartMeet. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-alice-white/60 hover:text-royal-blue text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-alice-white/60 hover:text-royal-blue text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-alice-white/60 hover:text-royal-blue text-sm transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}