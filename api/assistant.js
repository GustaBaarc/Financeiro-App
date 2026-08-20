import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Outros'];

const sendError = (response, status, message) => response.status(status).json({ error: message });

const parseModelResponse = (text) => {
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const result = JSON.parse(clean);
  if (!['transaction', 'bank'].includes(result?.intent) || !result?.data) {
    throw new Error('Resposta da IA fora do formato esperado.');
  }
  return result;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendError(response, 405, 'Método não permitido.');

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!geminiKey) return sendError(response, 503, 'A chave da assistente não foi configurada.');

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !supabaseKey) return sendError(response, 401, 'Sessão inválida.');

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error: authError } = await supabase.auth.getUser(token);
  if (authError) return sendError(response, 401, 'Sua sessão expirou. Entre novamente.');

  const prompt = String(request.body?.prompt || '').trim();
  const banks = Array.isArray(request.body?.banks) ? request.body.banks.slice(0, 30) : [];
  if (!prompt || prompt.length > 500) return sendError(response, 400, 'Mensagem vazia ou muito longa.');

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest' });
    const today = new Date().toISOString().slice(0, 10);
    const bankContext = banks.map(bank => ({
      id: String(bank.id),
      name: String(bank.name || '').slice(0, 80),
      last4: String(bank.last4 || '').slice(0, 4),
    }));

    const instruction = `Você interpreta uma mensagem para um aplicativo financeiro brasileiro.
Retorne somente JSON válido, sem markdown, no formato {"intent":"transaction"|"bank","data":{...}}.
Para transaction, data deve conter amount (número positivo), description, category (uma de ${JSON.stringify(CATEGORIES)}), type (debit|credit|income), status (confirmed|pending), installments (inteiro entre 1 e 48), bankId (ID disponível ou string vazia) e date (YYYY-MM-DD).
Para bank, data deve conter name, color (hexadecimal) e last4 (quatro dígitos ou string vazia).
Hoje é ${today}. Contas disponíveis: ${JSON.stringify(bankContext)}.
Mensagem do usuário: ${JSON.stringify(prompt)}`;

    const result = await model.generateContent(instruction);
    return response.status(200).json(parseModelResponse(result.response.text()));
  } catch (error) {
    console.error('Assistant error:', error);
    return sendError(response, 502, 'Não consegui interpretar agora. Tente descrever de outra forma.');
  }
}
