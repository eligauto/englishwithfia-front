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

// TODO: cuando haya backend, reemplazar con GET /api/testimonials
export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Juan Pablo Rozic',
    quote:
      '¡Excelente servicio! Las clases me parecen muy enriquecedoras, sobretodo ahora con el Club Level your English Up donde tenemos muchos momentos para debatir e intercambiar ideas usando el idioma. ¡Se arman grupos de gente muy buena onda!',
    since: 'Estudiante hace 3 años',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-jprozic/100/100',
  },
  {
    id: '2',
    name: 'Fabricio Fazio',
    quote:
      'Hacía años que buscaba un espacio para aprender y mejorar mi inglés como el que ofreces vos, Fia! Encantado con todo, además el acompañamiento que das y la paciencia que tenés no tiene precio.',
    since: 'Estudiante hace 2 años',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-ffazio/100/100',
  },
  {
    id: '3',
    name: 'Sonia Rivara',
    quote:
      'Fia, gracias por tanta paciencia para enseñarme y que me anime a hablar más. Este año volví a viajar y me di cuenta de cuánto había avanzado porque no necesité usar el traductor! Me encantan las clases y amo los juegos que nos ayudan a seguir aprendiendo.',
    since: 'Estudiante hace 3 años',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-srivara/100/100',
  },
  {
    id: '4',
    name: 'Candela Fasanini',
    quote:
      'Me siento muy cómoda con las clases, me gusta el contenido que vemos y me siento cómoda con vos como profesora. Me ayuda a soltarme para hablar en inglés.',
    since: 'Estudiante hace 5 meses',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-cfasanini/100/100',
  },
  {
    id: '5',
    name: 'Guadalupe Ferreyra',
    quote:
      'Me encantan las clases, es una de las primeras veces que me siento muy cómoda, que puedo darme cuenta la capacidad de entendimiento porque conversamos siempre en inglés. Siempre creí que había estudiado muchos años y no había aprendido nada, y me estás ayudando mucho a soltarme y poder animarme a conversar más.',
    since: 'Estudiante hace 6 meses',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-gferreyra/100/100',
  },
  {
    id: '6',
    name: 'Candela Veliz',
    quote:
      'Estoy re contenta con las clases; encontré un espacio donde practicar y aprender, disfrutando. Fia me está ayudando a dominar mucho más el inglés, y a sentirme con más confianza. ¡Gracias!',
    since: 'Estudiante hace seis meses',
    origin: 'Argentina',
    avatarUrl: 'https://picsum.photos/seed/testimonial-cveliz/100/100',
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
