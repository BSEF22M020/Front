'use client';

import { ArrowRight, Play, Users, ChartBar as BarChart3, FileText, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-alice-white to-white">
        <div className="absolute top-20 left-10 w-72 h-72 bg-royal-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-deep-wine/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-rich-black leading-tight">
                Meet Smarter with{' '}
                <span className="text-gradient">SmartMeet</span>
              </h1>
              <p className="text-xl sm:text-2xl text-onyx-gray/80 max-w-2xl leading-relaxed">
                Track real engagement, not just attendance. Get automated insights that help you run better meetings.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                className="bg-royal-blue hover:bg-deep-wine text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/main'}
              >
                Start Collaboration
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth'}
                className="border-2 border-deep-wine text-deep-wine hover:bg-deep-wine hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105"
              >
                <LogIn className="mr-2 w-5 h-5" />
                Login
              </Button>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-royal-blue">10K+</div>
                <div className="text-sm text-onyx-gray/60">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-royal-blue">500K+</div>
                <div className="text-sm text-onyx-gray/60">Meetings Hosted</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-royal-blue">98%</div>
                <div className="text-sm text-onyx-gray/60">Satisfaction</div>
              </div>
            </div> */}
          </div>

          {/* Right Content - Mock Video Interface */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-6 card-shadow-hover">
              {/* Mock Video Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="aspect-video bg-gradient-to-br from-royal-blue/20 to-deep-wine/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="w-16 h-16 bg-royal-blue rounded-full flex items-center justify-center animate-pulse-glow">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-lg text-sm font-medium text-rich-black">
                    Ayesha
                  </div>
                </div>
                <div className="aspect-video bg-gradient-to-br from-deep-wine/20 to-royal-blue/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="w-16 h-16 bg-deep-wine rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-lg text-sm font-medium text-rich-black">
                    Ali
                  </div>
                </div>
              </div>

              {/* Mock Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-royal-blue rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded"></div>
                </div>
                <div className="w-12 h-12 bg-alice-white rounded-full flex items-center justify-center border-2 border-onyx-gray/20">
                  <div className="w-6 h-6 bg-onyx-gray/40 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-alice-white rounded-full flex items-center justify-center border-2 border-onyx-gray/20">
                  <div className="w-6 h-6 bg-onyx-gray/40 rounded"></div>
                </div>
              </div>

              {/* Mock Engagement Panel */}
              <div className="bg-alice-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-rich-black">Live Engagement</span>
                  <BarChart3 className="w-4 h-4 text-royal-blue" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-onyx-gray">Attention Level</span>
                    <span className="font-semibold text-royal-blue">94%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-gradient-royal-wine h-2 rounded-full w-[94%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl animate-float">
              <FileText className="w-6 h-6 text-deep-wine" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
              <BarChart3 className="w-6 h-6 text-royal-blue" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}