import { CheckCircle } from 'lucide-react';
import { ABOUT } from '../../constants/content';

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <div className="flex justify-center">
          <img
            src={ABOUT.imagePlaceholder}
            alt="Fiamma Vigelzzi — English with Fia"
            className="rounded-3xl shadow-xl w-full max-w-sm object-cover aspect-[4/5]"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-fia-neutral-dark">
            {ABOUT.heading}{' '}
            <span className="text-fia-primary">{ABOUT.headingHighlight}</span>
          </h2>
          <p className="text-gray-500 leading-relaxed whitespace-pre-line">{ABOUT.bio}</p>

          <ul className="grid grid-cols-2 gap-3">
            {ABOUT.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium text-fia-neutral-dark">
                <CheckCircle size={18} className="text-fia-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
