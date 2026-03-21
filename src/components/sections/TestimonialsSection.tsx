import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote, MapPin } from 'lucide-react';
import { TESTIMONIALS } from '../../constants/content';
import type { TestimonialItem } from '../../types';
import { cn } from '../../utils/cn';

const AUTOPLAY_DELAY = 5000;

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <article className="w-full shrink-0 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-5">
      <Quote size={32} className="text-fia-primary opacity-30" />
      <p className="text-base text-gray-600 leading-relaxed italic flex-1">
        "{item.quote}"
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        {item.avatarUrl && (
          <img
            src={item.avatarUrl}
            alt={item.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        )}
        <div>
          <p className="text-sm font-semibold text-fia-neutral-dark">{item.name}</p>
          {item.since && (
            <p className="text-xs text-fia-secondary">{item.since}</p>
          )}
          {item.origin && (
            <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <MapPin size={10} className="shrink-0" />
              {item.origin}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = TESTIMONIALS.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTOPLAY_DELAY);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-fia-neutral-dark">
            Lo que dicen mis <span className="text-fia-primary">alumnos</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Resultados reales de personas que decidieron dar el paso.
          </p>
        </div>

        {/* Carrusel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Track — mx-12 deja espacio para las flechas */}
          <div className="overflow-hidden mx-12">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {TESTIMONIALS.map((item) => (
                <TestimonialCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Flecha anterior */}
          <button
            onClick={prev}
            aria-label="Testimonio anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-fia-neutral-dark hover:bg-fia-primary-light hover:border-fia-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Flecha siguiente */}
          <button
            onClick={next}
            aria-label="Siguiente testimonio"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-fia-neutral-dark hover:bg-fia-primary-light hover:border-fia-primary transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Testimonios">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Ir al testimonio ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 bg-fia-primary'
                  : 'w-2 bg-gray-300 hover:bg-fia-secondary',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

