import { Instagram, Mail, MessageCircle } from 'lucide-react';
import { FOOTER, SITE, SOCIAL_LINKS } from '../../constants/content';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  'message-circle': MessageCircle,
  mail: Mail,
};

export function Footer() {
  return (
    <footer className="bg-fia-neutral-dark text-gray-400 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
        <p className="text-fia-white text-xl font-bold">{SITE.name}</p>

        <div className="flex items-center gap-5">
          {SOCIAL_LINKS.map((link) => {
            const Icon = ICON_MAP[link.icon];
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="hover:text-fia-primary transition-colors"
              >
                {Icon && <Icon size={22} />}
              </a>
            );
          })}
        </div>

        <div className="text-center text-sm space-y-1">
          <p>{FOOTER.madeWith}</p>
          <p>{FOOTER.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
