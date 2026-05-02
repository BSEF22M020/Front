'use client';

import { BarChart3, FileText, Zap, Shield, Users, Clock, UserPlus, Building2, UsersRound, Calendar, Eye, FileBarChart, CheckCircle2, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_PREFIX } from '@/constants/api';

const submitResponse = async (data: { name: string; email: string; message: string }) => {
  try {
    const response = await axios.post(
      `${API_PREFIX}/api/getFeedback`,
      {
        name: data.name,
        email: data.email,
        response: data.message,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

const features = [
  {
    icon: BarChart3,
    title: 'High Accuracy Engagement Tracking',
    description: 'Track participant engagement and attention levels with high accuracy.',
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
    description: 'In-meeting chat, Screen sharing enhancing seamless communication among participants.',
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

type FormState = 'idle' | 'submitting' | 'exiting' | 'success' | 'entering';

export default function Features() {
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % workflowSteps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setFormState('submitting');

    try {
      await submitResponse({ name, email, message });

      // Trigger exit animation
      setFormState('exiting');

      // After fade-out completes, show success
      setTimeout(() => {
        setFormState('success');
      }, 500);
    } catch (err) {
      setFormState('idle');
      setError('Something went wrong. Please try again.');
    }
  };

  const handleReset = () => {
    // Trigger entering animation for fresh form
    setFormState('entering');
    setName('');
    setEmail('');
    setMessage('');
    setError(null);

    setTimeout(() => {
      setFormState('idle');
    }, 50); // tiny tick to kick the CSS transition
  };

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
            How It <span className="text-gradient">Works</span>
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
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="relative inline-block mb-8">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl blur-2xl opacity-30"></div>
                          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-12">
                            <Icon className="w-24 h-24 text-blue-600 mx-auto" strokeWidth={1.5} />
                          </div>
                        </div>
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full text-white font-bold text-lg mb-6">
                          {item.step}
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h3>
                        <p className="text-xl text-gray-600 leading-relaxed">{item.description}</p>
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
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for{' '}
              <span className="text-gradient bg-clip-text text-transparent">Better Meetings</span>
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Comprehensive post-meeting analytics and actionable insights delivered after every session
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-lg"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-royal-blue flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center" id="contact">
          <div className="relative bg-royal-blue rounded-3xl p-12 lg:p-16 shadow-2xl max-w-4xl mx-auto overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Let us Transform Your Meetings Together
              </h3>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Have questions? Want a demo? Our team is ready to help you get started.
              </p>

              {/* Form / Success panel — fixed min-height to avoid layout jump */}
              <div className="max-w-xl mx-auto" style={{ minHeight: '340px' }}>

                {/* ── FORM (idle | submitting | exiting | entering) ── */}
                <div
                  className="backdrop-blur-md rounded-2xl p-8 border border-white/20 transition-all duration-500"
                  style={{
                    opacity: formState === 'exiting' || formState === 'success' ? 0 : 1,
                    transform:
                      formState === 'exiting' || formState === 'success'
                        ? 'translateY(-16px) scale(0.97)'
                        : formState === 'entering'
                        ? 'translateY(16px) scale(0.97)'
                        : 'translateY(0) scale(1)',
                    pointerEvents: formState === 'success' ? 'none' : 'auto',
                    position: formState === 'success' ? 'absolute' : 'relative',
                    width: formState === 'success' ? '100%' : undefined,
                    left: formState === 'success' ? 0 : undefined,
                  }}
                >
                  <div className="grid gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={formState === 'submitting'}
                      className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 disabled:opacity-60"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={formState === 'submitting'}
                      className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 disabled:opacity-60"
                    />
                    <textarea
                      placeholder="Tell us about your requirements..."
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={formState === 'submitting'}
                      className="w-full px-6 py-4 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 resize-none disabled:opacity-60"
                    />

                    {error && (
                      <p className="text-red-200 text-sm text-left -mt-1 pl-1">{error}</p>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={formState === 'submitting'}
                      className="w-full bg-black text-white px-8 py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/50 relative overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                      {formState === 'submitting' ? (
                        <>
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                            />
                          </svg>
                          <span className="relative z-10">Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span className="relative z-10">Send Message</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-blue-900/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>

                {/* ── SUCCESS STATE ── */}
                <div
                  className="flex flex-col items-center justify-center gap-6 transition-all duration-500"
                  style={{
                    opacity: formState === 'success' ? 1 : 0,
                    transform: formState === 'success' ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
                    pointerEvents: formState === 'success' ? 'auto' : 'none',
                    position: formState === 'success' ? 'relative' : 'absolute',
                    width: '100%',
                    transitionDelay: formState === 'success' ? '200ms' : '0ms',
                  }}
                >
                  {/* Animated check circle */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400/30 rounded-full blur-2xl scale-150"></div>
                    <div className="relative w-24 h-24 bg-white/15 border-2 border-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle2
                        className="w-12 h-12 text-green-300"
                        strokeWidth={1.5}
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(134,239,172,0.6))',
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-white mb-2">Message Sent!</h4>
                    <p className="text-white/80 text-base leading-relaxed max-w-sm">
                      Thanks for reaching out. Our team will get back to you shortly.
                    </p>
                  </div>

                  {/* Submit another response */}
                  <button
                    onClick={handleReset}
                    className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 bg-white/10 text-white/90 text-sm font-medium hover:bg-white/20 hover:text-white transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Submit another response
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