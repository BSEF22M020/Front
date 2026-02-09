'use client';

import { useState, useEffect } from 'react';
import { Video, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-royal-wine rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-rich-black">
              Smart<span className="text-gradient">Meet</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#howwork" className="text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium">
              Get Started
            </a>
            <a href="#features" className="text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium">
              Features
            </a>
            <a href="#contact" className="text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium">
             Contact us
            </a>
            <a href="/auth" className="text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium">
              Login
            </a>
            <Button 
              className="bg-royal-blue hover:bg-deep-wine text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => window.location.href = '/main'}
            >
              My Organization
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-onyx-gray hover:text-royal-blue hover:bg-alice-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-2xl mx-4 mt-2">
            <div className="px-6 py-4 space-y-4">
              <a href="#howwork" className="block text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium py-2">
                Get Started
              </a>
              <a href="#features" className="block text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium py-2">
                Features
              </a>
              <a href="#contact" className="block text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium py-2">
                Contact us
              </a>
              <a href="/auth" className="block text-onyx-gray hover:text-royal-blue transition-colors duration-200 font-medium py-2">
                Login
              </a>

              <Button 
                className="w-full bg-royal-blue hover:bg-deep-wine text-white py-3 rounded-xl font-semibold"
                onClick={() => window.location.href = '/main'}
              >
                My Organization
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}