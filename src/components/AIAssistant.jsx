import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useExpense, CATEGORIES } from '../context/ExpenseContext';
import { Bot, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function AIAssistant({ onResult }) {
  const { banks } = useExpense();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleAI = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
      
      const banksContext = banks.map(b => `{ id: "${b.id}", name: "${b.name}", last4: "${b.last4}" }`).join(', ');
      
      const systemPrompt = `
        Você é um assistente financeiro de um aplicativo. O usuário enviará um texto em linguagem natural.
        Seu trabalho é entender se o usuário quer ADICIONAR UMA DESPESA/RECEITA ou CRIAR UM NOVO CARTÃO/BANCO.
        Você deve retornar ESTRITAMENTE e UNICAMENTE um objeto JSON. NUNCA retorne blocos de código (\`\`\`json), textos ou markdown.
        
        O JSON deve ter este formato exato:
        {
          "intent": "transaction" ou "bank",
          "data": { ... dependendo do intent }
        }

        Se for "transaction", o objeto "data" deve ter:
        1. "amount": (Número, sem moeda).
        2. "description": (String curta do gasto).
        3. "category": (Escolha a exata desta lista: ${CATEGORIES.join(', ')}).
        4. "type": ("debit", "credit" ou "income").
        5. "status": ("confirmed" ou "pending").
        6. "installments": (Inteiro, padrão 1).
        7. "bankId": (String). Escolha o ID que melhor bate com: [${banksContext}].
        8. "date": (String, formato "YYYY-MM-DD". Hoje é ${format(new Date(), 'yyyy-MM-dd')}).

        Se for "bank", o objeto "data" deve ter:
        1. "name": (Nome do Banco ou Cartão, ex: "Nubank", "Itaú").
        2. "color": (Código Hexadecimal da cor que combina com o banco. Ex: Nubank = "#8A05BE", Itau = "#EC7000", Inter = "#FF7A00").
        3. "last4": (String com os 4 últimos dígitos do cartão, se mencionado. Se não, string vazia "").

        Texto do usuário: "${prompt}"
      `;

      const result = await model.generateContent(systemPrompt);
      const textResponse = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(textResponse);
      onResult(parsedData);
      setPrompt('');
    } catch (error) {
      console.error(error);
      setErrorMsg("Erro: " + (error.message || "Não foi possível processar a mensagem. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--primary)', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)' }}>
      <form onSubmit={handleAI} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
          <Bot size={24} color="var(--primary)" />
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Ex: Comprei um tênis por 250 parcelado em 2x no crédito do Nubank..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
        />
        <button 
          type="submit" 
          disabled={loading || !prompt.trim()} 
          style={{ 
            background: 'var(--primary)', border: 'none', padding: '0.75rem', borderRadius: '8px', 
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          {loading ? <Loader2 size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <Send size={20} />}
        </button>
      </form>
      {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '3rem' }}>{errorMsg}</div>}
    </div>
  );
}
