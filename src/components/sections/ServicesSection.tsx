import { Monitor, MapPin, Globe } from 'lucide-react';
import { SERVICES } from '../../constants/content';
import type { ServiceItem } from '../../types';
import { cn } from '../../utils/cn';

const MODALITY_CONFIG = {
  online: { label: 'Online', Icon: Monitor },
  presencial: { label: 'Presencial', Icon: MapPin },
  ambos: { label: 'Online y presencial', Icon: Globe },
} as const;

interface ServiceCardProps {
  service: ServiceItem;
}

function ServiceCard({ service }: ServiceCardProps) {
  const { label, Icon } = MODALITY_CONFIG[service.modality];
  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
      <div>
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-fia-primary-light text-fia-primary rounded-full mb-3">
          {service.level}
        </span>
        <h3 className="text-lg font-bold text-fia-neutral-dark">{service.title}</h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{service.description}</p>
      </div>
      <div
        className={cn(
          'mt-auto flex items-center gap-2 text-xs font-medium',
          service.modality === 'online' ? 'text-fia-primary' : 'text-fia-secondary',
        )}
      >
        <Icon size={14} />
        {label}
      </div>
    </article>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-fia-neutral-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-fia-neutral-dark">
            ¿Qué tipo de <span className="text-fia-primary">clases</span> ofrezco?
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Cada clase está adaptada a tu nivel, ritmo y objetivos. Sin fórmulas genéricas, respetando tu estilo de aprendizaje.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
