import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const ExpenseContext = createContext(null);

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const mapTransaction = (transaction) => ({
  ...transaction,
  bankId: transaction.bank_id ?? transaction.bankId ?? '',
});

const requireUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  return user;
};

const toTransactionPayload = (transaction, userId, id = createId()) => ({
  id,
  description: String(transaction.description || '').trim(),
  amount: Number(transaction.amount),
  bank_id: transaction.bankId || null,
  type: transaction.type || 'debit',
  category: transaction.category || 'Outros',
  status: transaction.status || 'confirmed',
  date: transaction.date,
  user_id: userId,
});

export const ExpenseProvider = ({ children }) => {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const user = await requireUser();
        const [profileResult, banksResult, transactionsResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('banks').select('*'),
          supabase.from('transactions').select('*'),
        ]);

        const firstError = profileResult.error || banksResult.error || transactionsResult.error;
        if (firstError) throw firstError;
        if (!active) return;

        setUserProfile(profileResult.data || null);
        setBanks(banksResult.data || []);
        setTransactions((transactionsResult.data || []).map(mapTransaction));
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        if (active) setDataError(error.message || 'Não foi possível carregar seus dados.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []);

  const addTransaction = async (transaction) => {
    const user = await requireUser();
    const payload = toTransactionPayload(transaction, user.id);
    const { data, error } = await supabase.from('transactions').insert(payload).select().single();
    if (error) throw new Error(`Não foi possível salvar a transação: ${error.message}`);

    const mapped = mapTransaction(data);
    setTransactions(previous => [...previous, mapped]);
    return mapped;
  };

  const addBulkTransactions = async (newTransactions) => {
    if (!newTransactions.length) throw new Error('Nenhuma transação foi enviada para importação.');
    const user = await requireUser();
    const payload = newTransactions.map(transaction => toTransactionPayload(transaction, user.id));
    const { data, error } = await supabase.from('transactions').insert(payload).select();
    if (error) throw new Error(`Não foi possível importar as transações: ${error.message}`);

    const mapped = (data || []).map(mapTransaction);
    setTransactions(previous => [...previous, ...mapped]);
    return mapped;
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(`Não foi possível excluir a transação: ${error.message}`);
    setTransactions(previous => previous.filter(transaction => transaction.id !== id));
  };

  const updateTransaction = async (id, updatedData) => {
    const payload = {
      description: String(updatedData.description || '').trim(),
      amount: Number(updatedData.amount),
      bank_id: updatedData.bankId || null,
      type: updatedData.type,
      category: updatedData.category,
      status: updatedData.status || 'confirmed',
      date: updatedData.date,
    };
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Não foi possível atualizar a transação: ${error.message}`);

    const mapped = mapTransaction(data);
    setTransactions(previous => previous.map(transaction => transaction.id === id ? mapped : transaction));
    return mapped;
  };

  const addBank = async (bank) => {
    const user = await requireUser();
    const payload = {
      name: String(bank.name || '').trim(),
      color: bank.color || '#6366f1',
      last4: String(bank.last4 || '').trim(),
      user_id: user.id,
    };
    const { data, error } = await supabase.from('banks').insert(payload).select().single();
    if (error) throw new Error(`Não foi possível adicionar a conta: ${error.message}`);
    setBanks(previous => [...previous, data]);
    return data;
  };

  const updateBank = async (id, updatedData) => {
    const payload = {
      name: String(updatedData.name || '').trim(),
      color: updatedData.color,
      last4: String(updatedData.last4 || '').trim(),
    };
    const { data, error } = await supabase.from('banks').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Não foi possível atualizar a conta: ${error.message}`);
    setBanks(previous => previous.map(bank => bank.id === id ? data : bank));
    return data;
  };

  const deleteBank = async (id) => {
    const { error } = await supabase.from('banks').delete().eq('id', id);
    if (error) throw new Error(`Não foi possível excluir a conta: ${error.message}`);
    setBanks(previous => previous.filter(bank => bank.id !== id));
  };

  const value = useMemo(() => ({
    banks,
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addBulkTransactions,
    selectedMonth,
    setSelectedMonth,
    addBank,
    updateBank,
    deleteBank,
    userProfile,
    dataError,
    dismissDataError: () => setDataError(''),
  }), [banks, transactions, selectedMonth, userProfile, dataError]);

  return (
    <ExpenseContext.Provider value={value}>
      {isLoading ? (
        <div className="app-loading" role="status">
          <div className="loading-mark">MF</div>
          <div className="loading-bar"><span /></div>
          <p>Organizando suas finanças...</p>
        </div>
      ) : children}
    </ExpenseContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components -- provider e hook formam a mesma API de contexto.
export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense deve ser usado dentro de ExpenseProvider.');
  return context;
};
