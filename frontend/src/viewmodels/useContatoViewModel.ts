import { useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, EMPTY_CONTACT_FORM, type ContactFormData, type ContactReceipt } from '../models/contact.model';
import { sendContact } from '../services/contacts.service';
import { ApiError } from '../services/api';
import { usePageNavigation } from './usePageNavigation';

export function useContatoViewModel() {
  const navigation = usePageNavigation('contato');
  const [receipt, setReceipt] = useState<ContactReceipt | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sending = useRef(false);
  const received = useRef(false);
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema), defaultValues: EMPTY_CONTACT_FORM,
  });

  const submit = async (event?: BaseSyntheticEvent) => {
    await form.handleSubmit(async ({ name, email, subject, message }) => {
      if (sending.current || received.current) return;
      sending.current = true;
      setIsSending(true);
      setSubmitError(null);
      try {
        const result = await sendContact({ name, email, subject, message });
        received.current = true;
        setReceipt(result);
        form.reset(EMPTY_CONTACT_FORM);
      } catch (cause) {
        setSubmitError(cause instanceof ApiError && cause.status === 429
          ? 'Muitas tentativas de envio. Aguarde um minuto antes de tentar novamente.'
          : cause instanceof ApiError && cause.status < 500
            ? cause.message
            : 'Não foi possível confirmar o recebimento. Seus dados foram mantidos. Confira a conexão antes de tentar novamente.');
      } finally {
        sending.current = false;
        setIsSending(false);
      }
    })(event);
  };

  const newMessage = () => {
    received.current = false;
    setReceipt(null);
    setSubmitError(null);
  };

  return { ...navigation, form, submit, receipt, submitError, isSending, newMessage };
}

export type ContatoViewModel = ReturnType<typeof useContatoViewModel>;
