import { useState } from 'react';
import { addMonths } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CATEGORIES } from '../constants';
import { dateInputToISOString, toDateInputValue } from '../utils/format';
import Modal from './Modal';

export default function TransactionModal({ onClose, initialData, onSaved }) {
  const { banks, addTransaction, addBulkTransactions, updateTransaction } = useExpense();
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [bankId, setBankId] = useState(initialData?.bankId || banks[0]?.id || '');
  const [type, setType] = useState(initialData?.type || 'credit');
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [installments, setInstallments] = useState(Number(initialData?.installments) || 1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [status, setStatus] = useState(initialData?.status || 'confirmed');
  const [date, setDate] = useState(toDateInputValue(initialData?.date || new Date()));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const baseDate = new Date(dateInputToISOString(date));
      const baseTransaction = {
        description: description.trim(),
        amount: parsedAmount,
        bankId,
        type,
        category,
        status,
        date: baseDate.toISOString(),
      };

      if (isEditing) {
        await updateTransaction(initialData.id, baseTransaction);
      } else if (isRecurring) {
        const recurringTransactions = Array.from({ length: 12 }, (_, index) => ({
          ...baseTransaction,
          date: addMonths(baseDate, index).toISOString(),
          status: index === 0 ? status : 'pending',
        }));
        await addBulkTransactions(recurringTransactions);
      } else if (type === 'credit' && installments > 1) {
        const totalInCents = Math.round(parsedAmount * 100);
        const baseInstallment = Math.floor(totalInCents / installments);
        const remainder = totalInCents % installments;
        const installmentTransactions = Array.from({ length: installments }, (_, index) => ({
          ...baseTransaction,
          description: `${description.trim()} (${index + 1}/${installments})`,
          amount: (baseInstallment + (index < remainder ? 1 : 0)) / 100,
          date: addMonths(baseDate, index).toISOString(),
        }));
        await addBulkTransactions(installmentTransactions);
      } else {
        await addTransaction(baseTransaction);
      }

      onSaved?.(isEditing ? 'Transação atualizada.' : 'Transação adicionada.');
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível salvar a transação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Editar transação' : 'Nova transação'}
      eyebrow={isEditing ? 'Ajuste os detalhes' : 'Registre seu movimento'}
      description={isEditing ? 'As alterações serão refletidas no seu saldo.' : 'Preencha os dados para manter seu mês organizado.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="feedback-message error" role="alert">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="transaction-description">Descrição</label>
          <input
            id="transaction-description"
            type="text"
            className="form-control"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Supermercado da semana"
            autoFocus
            required
          />
        </div>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label htmlFor="transaction-amount">Valor</label>
            <div className="input-prefix">
              <span>R$</span>
              <input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="transaction-date">Data</label>
            <input id="transaction-date" type="date" className="form-control" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label htmlFor="transaction-type">Tipo</label>
            <select id="transaction-type" className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="credit">Despesa no crédito</option>
              <option value="debit">Despesa no débito / Pix</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="transaction-category">Categoria</label>
            <select id="transaction-category" className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-bank">Conta ou cartão</label>
          <select id="transaction-bank" className="form-control" value={bankId} onChange={(event) => setBankId(event.target.value)}>
            <option value="">Sem conta vinculada</option>
            {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
          {!banks.length && <small className="field-hint">Você pode salvar agora e cadastrar uma conta depois.</small>}
        </div>

        {type === 'credit' && !isRecurring && !isEditing && (
          <div className="form-group">
            <label htmlFor="transaction-installments">Número de parcelas</label>
            <input
              id="transaction-installments"
              type="number"
              min="1"
              max="48"
              className="form-control"
              value={installments}
              onChange={(event) => setInstallments(Math.max(1, Number(event.target.value) || 1))}
            />
            {installments > 1 && <small className="field-hint">O valor total será dividido sem perder centavos.</small>}
          </div>
        )}

        {!isEditing && type === 'income' && (
          <label className="check-row" htmlFor="recurring">
            <input id="recurring" type="checkbox" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} />
            <span><strong>Repetir mensalmente</strong><small>Cria 12 lançamentos; os próximos ficam como previstos.</small></span>
          </label>
        )}

        {isEditing && (
          <div className="form-group">
            <label htmlFor="transaction-status">Status</label>
            <select id="transaction-status" className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="confirmed">Confirmado / pago</option>
              <option value="pending">Pendente / previsto</option>
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 className="spin" size={18} /> Salvando...</> : isEditing ? 'Salvar alterações' : 'Adicionar transação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
