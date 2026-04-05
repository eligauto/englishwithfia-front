import { HERO } from '../../constants/content';

export function HeroSection() {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-app-neutral-light to-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-app-neutral-dark leading-tight">
            {HERO.heading}{' '}
            <span className="text-app-primary">{HERO.headingHighlight}</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-md">{HERO.subheading}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#contact"
              className="px-6 py-3 bg-app-primary text-white font-semibold rounded-xl hover:bg-app-primary-dark transition-colors shadow-md"
            >
              {HERO.cta}
            </a>
            <a
              href="#services"
              className="px-6 py-3 border-2 border-app-primary text-app-primary font-semibold rounded-xl hover:bg-app-primary-light transition-colors"
            >
              {HERO.ctaSecondary}
            </a>
          </div>
        </div>

        {/* Image */}
        <div className="flex justify-center">
          <img
            src={HERO.imagePlaceholder}
            alt="English with Fia"
            className="rounded-3xl shadow-xl w-full max-w-md object-cover aspect-[4/3]"
          />
        </div>
      </div>
    </section>
  );
}
