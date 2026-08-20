import { useMemo, useState } from 'react';
import { addMonths, isSameMonth, subMonths } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Landmark,
  Search,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CATEGORY_COLORS, TRANSACTION_TYPE_LABELS } from '../constants';
import { formatCurrency, formatShortDate } from '../utils/format';

export default function Dashboard({ onEdit, onMessage }) {
  const { transactions, banks, deleteTransaction, selectedMonth, setSelectedMonth } = useExpense();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const monthTransactions = useMemo(() => transactions
    .filter(transaction => {
      const date = new Date(transaction.date);
      return !Number.isNaN(date.getTime()) && isSameMonth(date, selectedMonth);
    })
    .sort((first, second) => new Date(second.date) - new Date(first.date)), [transactions, selectedMonth]);

  const confirmed = monthTransactions.filter(transaction => transaction.status !== 'pending');
  const expenses = confirmed.filter(transaction => transaction.type !== 'income');
  const incomes = confirmed.filter(transaction => transaction.type === 'income');
  const monthlyExpense = expenses.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const monthlyIncome = incomes.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const balance = monthlyIncome - monthlyExpense;
  const pendingAmount = monthTransactions
    .filter(transaction => transaction.status === 'pending')
    .reduce((total, transaction) => total + (transaction.type === 'income' ? 1 : -1) * Number(transaction.amount || 0), 0);

  const categoryData = useMemo(() => {
    const totals = expenses.reduce((result, transaction) => {
      const category = transaction.category || 'Outros';
      result[category] = (result[category] || 0) + Number(transaction.amount || 0);
      return result;
    }, {});

    return Object.entries(totals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: monthlyExpense ? (amount / monthlyExpense) * 100 : 0,
      }))
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 6);
  }, [expenses, monthlyExpense]);

  const visibleTransactions = monthTransactions.filter((transaction) => {
    const matchesFilter = filter === 'all'
      || (filter === 'expense' && transaction.type !== 'income')
      || transaction.type === filter;
    const matchesQuery = transaction.description?.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const getBankName = (id) => banks.find(bank => String(bank.id) === String(id))?.name || 'Sem conta';

  const handleMonthChange = (event) => {
    const [year, month] = event.target.value.split('-').map(Number);
    if (year && month) setSelectedMonth(new Date(year, month - 1, 1, 12));
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm(`Excluir “${transaction.description}”? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteTransaction(transaction.id);
      onMessage?.('Transação excluída.', 'success');
    } catch (error) {
      onMessage?.(error.message, 'error');
    }
  };

  return (
    <div className="dashboard">
      <div className="month-toolbar">
        <div>
          <span className="eyebrow">Visão mensal</span>
          <label className="month-picker">
            <span className="sr-only">Escolha o mês</span>
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={handleMonthChange}
            />
          </label>
        </div>
        <div className="month-navigation">
          <button type="button" className="icon-button" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} aria-label="Mês anterior"><ChevronLeft size={19} /></button>
          <button type="button" className="today-button" onClick={() => setSelectedMonth(new Date())}>Hoje</button>
          <button type="button" className="icon-button" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} aria-label="Próximo mês"><ChevronRight size={19} /></button>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card balance-card">
          <div className="metric-top"><span className="metric-icon"><Landmark size={20} /></span><span>Saldo do mês</span></div>
          <strong className={balance < 0 ? 'negative' : ''}>{formatCurrency(balance)}</strong>
          <small>{pendingAmount === 0 ? 'Sem valores pendentes' : `${formatCurrency(Math.abs(pendingAmount))} ${pendingAmount > 0 ? 'a receber' : 'previstos'}`}</small>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon income"><ArrowUpRight size={20} /></span><span>Receitas</span></div>
          <strong>{formatCurrency(monthlyIncome)}</strong>
          <small>{incomes.length} {incomes.length === 1 ? 'entrada confirmada' : 'entradas confirmadas'}</small>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon expense"><ArrowDownRight size={20} /></span><span>Despesas</span></div>
          <strong>{formatCurrency(monthlyExpense)}</strong>
          <small>{expenses.length} {expenses.length === 1 ? 'saída confirmada' : 'saídas confirmadas'}</small>
        </article>
      </div>

      <div className="insights-grid">
        <section className="panel category-panel">
          <div className="section-heading">
            <div><span className="eyebrow">Distribuição</span><h3>Gastos por categoria</h3></div>
            <span className="section-icon"><TrendingUp size={19} /></span>
          </div>
          {categoryData.length ? (
            <div className="category-list">
              {categoryData.map(category => (
                <div className="category-row" key={category.name}>
                  <div className="category-meta">
                    <span><i style={{ background: CATEGORY_COLORS[category.name] || CATEGORY_COLORS.Outros }} />{category.name}</span>
                    <strong>{formatCurrency(category.amount)}</strong>
                  </div>
                  <div className="progress-track"><span style={{ width: `${category.percentage}%`, background: CATEGORY_COLORS[category.name] || CATEGORY_COLORS.Outros }} /></div>
                  <small>{category.percentage.toFixed(0)}% das despesas</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="compact-empty"><WalletCards size={24} /><p>Suas categorias aparecerão aqui quando houver despesas no mês.</p></div>
          )}
        </section>

        <section className="panel activity-panel">
          <div className="section-heading history-heading">
            <div><span className="eyebrow">Movimentações</span><h3>Histórico do mês</h3></div>
            <span className="count-pill">{monthTransactions.length}</span>
          </div>

          <div className="history-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar transação" />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtrar transações">
              <option value="all">Todas</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
            </select>
          </div>

          {visibleTransactions.length ? (
            <div className="transaction-list">
              {visibleTransactions.map(transaction => {
                const isIncome = transaction.type === 'income';
                return (
                  <article className={`transaction-item ${transaction.status === 'pending' ? 'pending' : ''}`} key={transaction.id}>
                    <span className={`transaction-symbol ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}
                    </span>
                    <div className="transaction-main">
                      <div className="transaction-title">
                        <strong>{transaction.description}</strong>
                        {transaction.status === 'pending' && <span className="status-badge"><Clock3 size={12} /> Pendente</span>}
                      </div>
                      <span>{formatShortDate(transaction.date)} · {getBankName(transaction.bankId)} · {transaction.category || 'Outros'}</span>
                    </div>
                    <div className="transaction-value">
                      <strong className={isIncome ? 'positive' : ''}>{isIncome ? '+' : '−'} {formatCurrency(transaction.amount)}</strong>
                      <span>{TRANSACTION_TYPE_LABELS[transaction.type] || 'Débito / Pix'}</span>
                    </div>
                    <div className="transaction-actions">
                      <button type="button" className="icon-button ghost" onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description}`}><Edit3 size={17} /></button>
                      <button type="button" className="icon-button ghost danger" onClick={() => handleDelete(transaction)} aria-label={`Excluir ${transaction.description}`}><Trash2 size={17} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span><Search size={24} /></span>
              <h4>{monthTransactions.length ? 'Nenhum resultado encontrado' : 'Um mês pronto para começar'}</h4>
              <p>{monthTransactions.length ? 'Tente mudar o termo ou o filtro.' : 'Adicione uma transação para acompanhar seu saldo e seus hábitos.'}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
