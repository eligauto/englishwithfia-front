import type { NavLink, ServiceItem, SocialLink, TestimonialItem } from '../types';

// ──────────────────────────────────────────────
// Todo el texto visible del sitio vive aquí.
// NUNCA hardcodear strings directamente en los componentes.
// ──────────────────────────────────────────────

export const SITE = {
  name: 'English with Fia',
  tagline: 'Aprendé inglés con confianza',
  description:
    'Clases personalizadas de inglés con Fiamma Vigelzzi. Online y presencial.',
  email: 'fia@englishwithfia.com',
  whatsapp: '+54 9 11 0000 0000',
  instagram: 'https://instagram.com/englishwithfia',
} as const;

export const NAV_LINKS: NavLink[] = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Sobre mí', href: '#about' },
  { label: 'Servicios', href: '#services' },
  { label: 'Testimonios', href: '#testimonials' },
  { label: 'Contacto', href: '#contact' },
];

export const HERO = {
  heading: 'Aprendé inglés de manera',
  headingHighlight: 'dinámica y descontracturada',
  subheading:
    'Clases personalizadas adaptadas a tu nivel y objetivos. 100% online, a tu ritmo.',
  cta: 'Empezá hoy',
  ctaSecondary: 'Conocer más',
  imagePlaceholder: 'https://picsum.photos/seed/english-fia-hero/800/600',
} as const;

export const ABOUT = {
  heading: 'Sobre',
  headingHighlight: 'Mi',
  bio: `Soy Fía, profesora de inglés con más de 10 años de experiencia. 
Me especializo en ayudar a adultos a aprender este idioma de manera dinámica  para superar el miedo a expresarse. 
Buscamos alcanzar tus metas, ya sea para el trabajo, para viajar, o simplemente por amor al idioma. 
Hablar inglés amplía tu capacidad de entender el mundo. `,
  imagePlaceholder: 'https://picsum.photos/seed/fia-portrait/400/500',
  highlights: [
    '+10 años de experiencia',
    'Certificado universitario',
    '+300 alumnos',
    'Clases 100% remotas',
  ],
} as const;

export const SERVICES: ServiceItem[] = [
  {
    id: 'beginner',
    title: 'Inglés desde cero',
    description:
      'Ideal si nunca tuviste clases o querés retomar desde las bases. Metodología clara y sin presión.',
    level: 'Principiante (A1-A2)',
    modality: 'online',
  },
  {
    id: 'intermediate',
    title: 'Conversación y fluidez',
    description:
      'Para quienes ya tienen una base y quieren ganar confianza al hablar. Práctica real de conversación.',
    level: 'Intermedio (B1-B2)',
    modality: 'online',
  },
  {
    id: 'advanced',
    title: 'Inglés con propósitos específicos',
    description:
      'Orientá tu conocimiento al lenguaje específico de tu campo de trabajo o estudio.',
    level: 'Avanzado (C1-C2)',
    modality: 'online',
  },
  {
    id: 'exam',
    title: 'Preparación de exámenes',
    description:
      'Preparate para FCE, CAE, IELTS o TOEFL con material específico y simulacros.',
    level: 'Todos los niveles',
    modality: 'online',
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Valentina G.',
    quote:
      'Gracias a Fia salí de mi zona de confort y hoy puedo tener conversaciones largas en inglés. ¡La recomiendo un montón!',
    level: 'Intermedio',
    avatarUrl: 'https://picsum.photos/seed/testimonial-1/100/100',
  },
  {
    id: '2',
    name: 'Martín R.',
    quote:
      'En 3 meses mejoré más que en años de clases grupales. El enfoque personalizado hace toda la diferencia.',
    level: 'Principiante',
    avatarUrl: 'https://picsum.photos/seed/testimonial-2/100/100',
  },
  {
    id: '3',
    name: 'Camila S.',
    quote:
      'Aprobé el FCE con distinción. Fia tiene una paciencia increíble y explica todo con mucha claridad.',
    level: 'Examen FCE',
    avatarUrl: 'https://picsum.photos/seed/testimonial-3/100/100',
  },
];

export const CONTACT = {
  heading: 'Hablemos',
  subheading:
    'Contame en qué nivel estás y cuáles son tus objetivos. Te respondo en menos de 24 horas.',
  namePlaceholder: 'Tu nombre',
  emailPlaceholder: 'Tu email',
  messagePlaceholder: '¿En qué nivel estás? ¿Cuáles son tus objetivos?',
  submitLabel: 'Enviar mensaje',
  successMessage: '¡Gracias! Te contactaré pronto.',
} as const;

export const FOOTER = {
  copyright: `© ${new Date().getFullYear()} English with Fia. Todos los derechos reservados.`,
  madeWith: 'Hecho con ❤️ para ayudarte a hablar inglés.',
} as const;

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Instagram',
    href: SITE.instagram,
    icon: 'instagram',
  },
  {
    label: 'WhatsApp',
    href: `https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}`,
    icon: 'message-circle',
  },
  {
    label: 'Email',
    href: `mailto:${SITE.email}`,
    icon: 'mail',
  },
];
