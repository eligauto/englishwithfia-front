import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '../../constants/content';
import type { TestimonialItem } from '../../types';

interface TestimonialCardProps {
  item: TestimonialItem;
}

function TestimonialCard({ item }: TestimonialCardProps) {
  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
      <Quote size={28} className="text-fia-primary opacity-40" />
      <p className="text-sm text-gray-600 leading-relaxed italic">"{item.quote}"</p>
      <div className="mt-auto flex items-center gap-3">
        {item.avatarUrl && (
          <img
            src={item.avatarUrl}
            alt={item.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <p className="text-sm font-semibold text-fia-neutral-dark">{item.name}</p>
          <p className="text-xs text-fia-secondary">{item.level}</p>
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-fia-neutral-dark">
            Lo que dicen mis <span className="text-fia-primary">alumnos</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Resultados reales de personas que decidieron dar el paso.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <TestimonialCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
