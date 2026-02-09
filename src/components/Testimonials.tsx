import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Product Manager',
    company: 'TechCorp',
    image: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
    content: 'SmartMeet transformed how we run our product reviews. The engagement tracking helps us identify when we\'re losing the team and adjust our approach in real-time.',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Engineering Director',
    company: 'StartupXYZ',
    image: 'https://images.pexels.com/photos/3785074/pexels-photo-3785074.jpeg?auto=compress&cs=tinysrgb&w=150',
    content: 'The automated reports are a game-changer. Instead of manually taking notes and follow-ups, I get comprehensive meeting summaries that help drive action items.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Team Lead',
    company: 'GlobalCorp',
    image: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=150',
    content: 'Finally, a meeting platform that actually makes meetings better, not just possible. The engagement insights help me understand what resonates with my team.',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-alice-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-rich-black mb-6">
            Loved by teams
            <span className="text-gradient"> worldwide</span>
          </h2>
          <p className="text-xl text-onyx-gray/80 max-w-2xl mx-auto">
            See how SmartMeet is helping organizations run more effective and engaging meetings.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 card-shadow hover:card-shadow-hover transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="mb-6">
                <Quote className="w-8 h-8 text-royal-blue/30" />
              </div>

              {/* Rating */}
              <div className="flex mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-onyx-gray/80 mb-8 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-rich-black">{testimonial.name}</h4>
                  <p className="text-sm text-onyx-gray/60">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-3xl p-12 card-shadow">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gradient mb-2">99.9%</div>
              <div className="text-onyx-gray/60">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient mb-2">2.3M</div>
              <div className="text-onyx-gray/60">Minutes Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient mb-2">85%</div>
              <div className="text-onyx-gray/60">More Engagement</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient mb-2">150+</div>
              <div className="text-onyx-gray/60">Enterprise Clients</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}