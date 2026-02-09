'use client';

import { BarChart3, FileText, Zap, Shield, Users, Clock, UserPlus, Building2, UsersRound, Calendar, Eye, FileBarChart } from 'lucide-react';
import { useState, useEffect } from 'react';

const features = [
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track participant engagement and attention levels with live dashboards and instant insights.',
  },
  {
    icon: FileText,
    title: 'Smart Reports',
    description: 'Automated summaries with attendance, participation metrics, and engagement scores.',
  },
  {
    icon: Zap,
    title: 'Instant Connection',
    description: 'Browser-based meetings with zero downloads. Join in one click.',
  },
  {
    icon: Shield,
    title: 'Enterprise Grade Security',
    description: 'End-to-end encryption with compliance-ready data protection.',
  },
  {
    icon: Users,
    title: 'Advanced Collaboration',
    description: 'Breakout rooms, screen sharing, whiteboard, and recording capabilities.',
  },
  {
    icon: Clock,
    title: 'AI Insights',
    description: 'Optimize meeting effectiveness with ML-powered recommendations.',
  }
];

const workflowSteps = [
  { step: 1, title: "Signup or Login", icon: UserPlus, description: "Create your account or sign in securely" },
  { step: 2, title: "Create Organization", icon: Building2, description: "Set up your workspace and brand" },
  { step: 3, title: "Enroll Members", icon: UsersRound, description: "Invite your team members to join" },
  { step: 4, title: "Schedule Meetings", icon: Calendar, description: "Plan and organize video conferences" },
  { step: 5, title: "Track & Monitor", icon: Eye, description: "Real-time engagement analytics" },
  { step: 6, title: "Get Reports", icon: FileBarChart, description: "Comprehensive attentiveness insights" }
];

export default function Features() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % workflowSteps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="howwork" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-gray-50 to-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* How It Works Carousel */}
        <div className="mb-32">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 text-center">
            How It <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Follow these simple steps to get started</p>
          
          <div className="relative max-w-6xl mx-auto">
            {/* Progress Bar */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gray-200 hidden lg:block">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / workflowSteps.length) * 100}%` }}
              ></div>
            </div>

            {/* Steps Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                {workflowSteps.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 px-4"
                    >
                      <div className="max-w-2xl mx-auto text-center">
                        {/* Icon */}
                        <div className="relative inline-block mb-8">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl blur-2xl opacity-30"></div>
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-12">
                            <Icon className="w-24 h-24 text-blue-600 mx-auto" strokeWidth={1.5} />
                          </div>
                        </div>

                        {/* Step Number */}
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full text-white font-bold text-lg mb-6">
                          {item.step}
                        </div>

                        {/* Content */}
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <p className="text-xl text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-12">
              {workflowSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentStep 
                      ? 'w-12 h-3 bg-gradient-to-r from-blue-600 to-blue-800' 
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                ></button>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentStep((prev) => (prev - 1 + workflowSteps.length) % workflowSteps.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Previous step"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) % workflowSteps.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Next step"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20" id="features">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Powerful Features for <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Modern Teams</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative"
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 group-hover:border-blue-200 overflow-hidden">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon with animated background */}
                      <div className="relative mb-6 inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-700/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          <Icon className="w-10 h-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" strokeWidth={1.5} />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 group-hover:bg-clip-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center" id="contact">
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 lg:p-16 shadow-2xl max-w-4xl mx-auto overflow-hidden group">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Let's Transform Your Meetings Together
              </h3>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Have questions? Want a demo? Our team is ready to help you get started.
              </p>
              
              {/* Contact Form */}
              <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="grid gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  />
                  <textarea
                    placeholder="Tell us about your requirements..."
                    rows={4}
                    className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 resize-none"
                  ></textarea>
                  <button className="w-full bg-white text-blue-600 px-8 py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-white/50 relative overflow-hidden group/btn">
                    <span className="relative z-10">Send Message</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-800/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}