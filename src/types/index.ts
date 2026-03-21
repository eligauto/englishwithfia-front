export interface NavLink {
  label: string;
  href: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  level: string;
  modality: 'online' | 'presencial' | 'ambos';
}

export interface TestimonialItem {
  id: string;
  name: string;
  quote: string;
  level?: string;
  since?: string;
  origin?: string;
  avatarUrl?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}
