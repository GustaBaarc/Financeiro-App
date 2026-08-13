import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Salário',
  'Outros'
];

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) setUserProfile(profile);
        }

        const [{ data: banksData }, { data: txData }] = await Promise.all([
          supabase.from('banks').select('*'),
          supabase.from('transactions').select('*')
        ]);
        
        if (banksData) setBanks(banksData);
        if (txData) {
          // Mapeando do banco (bank_id) para o formato que o React espera (bankId)
          const mappedTxs = txData.map(tx => ({ ...tx, bankId: tx.bank_id || tx.bankId }));
          setTransactions(mappedTxs);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const addTransaction = async (transaction) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // O banco do usuário não gera ID automaticamente, então criamos um aqui (junto com o mapeamento do bank_id)
    const { id, bankId, ...txData } = transaction; 
    const newTx = { ...txData, id: Date.now().toString(), bank_id: bankId, user_id: user?.id };
    
    const { data, error } = await supabase.from('transactions').insert([newTx]).select().single();
    if (!error && data) {
      setTransactions(prev => [...prev, { ...data, bankId: data.bank_id }]);
    } else {
      console.error(error);
      alert("Erro ao salvar transação: " + error.message);
    }
  };

  const addBulkTransactions = async (newTransactions) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const txsWithUser = newTransactions.map((tx, index) => {
      const { id, bankId, ...rest } = tx;
      // Gera IDs únicos para cada transação em lote
      return { ...rest, id: (Date.now() + index).toString(), bank_id: bankId, user_id: user?.id };
    });
    
    const { data, error } = await supabase.from('transactions').insert(txsWithUser).select();
    if (!error && data) {
      const mapped = data.map(tx => ({ ...tx, bankId: tx.bank_id }));
      setTransactions(prev => [...prev, ...mapped]);
    } else {
      console.error(error);
      alert("Erro ao salvar transações em lote: " + error.message);
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      console.error(error);
    }
  };

  const updateTransaction = async (id, updatedData) => {
    const { bankId, ...rest } = updatedData;
    const dbPayload = bankId ? { ...rest, bank_id: bankId } : rest;
    
    const { error } = await supabase.from('transactions').update(dbPayload).eq('id', id);
    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    } else {
      console.error(error);
      alert("Erro ao editar: " + error.message);
    }
  };

  const addBank = async (bank) => {
    const { data: { user } } = await supabase.auth.getUser();
    const newBank = { ...bank, user_id: user?.id };
    const { data, error } = await supabase.from('banks').insert([newBank]).select().single();
    if (!error && data) {
      setBanks(prev => [...prev, data]);
    } else {
      console.error(error);
    }
  };

  const updateBank = async (id, updatedData) => {
    const { error } = await supabase.from('banks').update(updatedData).eq('id', id);
    if (!error) {
      setBanks(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    } else {
      console.error(error);
    }
  };

  const deleteBank = async (id) => {
    const { error } = await supabase.from('banks').delete().eq('id', id);
    if (!error) {
      setBanks(prev => prev.filter(b => b.id !== id));
    } else {
      console.error(error);
    }
  };

  return (
    <ExpenseContext.Provider value={{ 
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
      userProfile
    }}>
      {isLoading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Conectando ao banco de dados...</p>
        </div>
      ) : children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
