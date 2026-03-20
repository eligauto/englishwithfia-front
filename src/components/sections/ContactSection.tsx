import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';
import { CONTACT, SITE } from '../../constants/content';
import type { ContactFormData } from '../../types';
import { cn } from '../../utils/cn';

export function ContactSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<ContactFormData>();

  function onSubmit(_data: ContactFormData) {
    // TODO: conectar con POST /api/contact cuando haya backend
    // Por ahora simula un envío exitoso
    return new Promise<void>((resolve) => setTimeout(() => { reset(); resolve(); }, 800));
  }

  return (
    <section id="contact" className="py-20 bg-fia-neutral-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
        {/* Info */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-fia-neutral-dark">
            <span className="text-fia-primary">{CONTACT.heading}</span>
          </h2>
          <p className="text-gray-500 leading-relaxed">{CONTACT.subheading}</p>
          <div className="pt-4 space-y-2 text-sm text-gray-500">
            <p>📧 {SITE.email}</p>
            <p>💬 {SITE.whatsapp}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {isSubmitSuccessful && (
            <p className="text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
              {CONTACT.successMessage}
            </p>
          )}

          <div>
            <input
              {...register('name', { required: 'El nombre es obligatorio' })}
              placeholder={CONTACT.namePlaceholder}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition',
                errors.name ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <input
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
              })}
              type="email"
              placeholder={CONTACT.emailPlaceholder}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition',
                errors.email ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <textarea
              {...register('message', { required: 'El mensaje es obligatorio' })}
              placeholder={CONTACT.messagePlaceholder}
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fia-primary transition resize-none',
                errors.message ? 'border-red-400' : 'border-gray-200',
              )}
            />
            {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-fia-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            <Send size={16} />
            {isSubmitting ? 'Enviando...' : CONTACT.submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
