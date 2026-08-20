import { useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { supabase } from '../supabaseClient';

const SUGGESTIONS = [
  'Gastei R$ 80 no mercado',
  'Recebi meu salário hoje',
  'Comprei em 3 parcelas',
];

export default function AIAssistant({ onResult }) {
  const { banks } = useExpense();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAI = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          banks: banks.map(({ id, name, last4 }) => ({ id, name, last4 })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'A assistente está indisponível agora.');

      await onResult(payload);
      setPrompt('');
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível interpretar a mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-assistant">
      <div className="ai-orb"><Bot size={23} /><span /></div>
      <div className="ai-content">
        <div className="ai-heading"><span><Sparkles size={14} /> Assistente inteligente</span><p>Conte o que aconteceu e eu preencho para você.</p></div>
        <form onSubmit={handleAI} className="ai-form">
          <input
            type="text"
            placeholder="Ex.: Paguei R$ 120 de internet hoje..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={loading}
            maxLength={500}
            aria-label="Descreva uma movimentação financeira"
          />
          <button type="submit" disabled={loading || !prompt.trim()} aria-label="Enviar para a assistente">
            {loading ? <Loader2 className="spin" size={19} /> : <Send size={19} />}
          </button>
        </form>
        <div className="ai-suggestions">
          {SUGGESTIONS.map(suggestion => (
            <button type="button" key={suggestion} onClick={() => setPrompt(suggestion)}>{suggestion}</button>
          ))}
        </div>
        {errorMessage && <p className="ai-error" role="alert">{errorMessage}</p>}
      </div>
    </section>
  );
}
