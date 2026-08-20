import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { decodeCSVFile, parseCSVWithMeta } from '../utils/csvParser';
import { formatCurrency, formatShortDate } from '../utils/format';
import Modal from './Modal';

export default function CsvImportModal({ onClose, onImported }) {
  const { banks, addBulkTransactions } = useExpense();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bankId, setBankId] = useState(banks[0]?.id || '');
  const [type, setType] = useState('credit');
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);

  const readFile = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Selecione um arquivo com extensão .csv.');
      return;
    }

    setReading(true);
    setError('');
    setPreview(null);
    try {
      const text = await decodeCSVFile(selectedFile);
      const parsed = parseCSVWithMeta(text);
      setFile(selectedFile);
      setPreview(parsed);
    } catch (readError) {
      setFile(null);
      setError(readError.message || 'Não foi possível ler o arquivo.');
    } finally {
      setReading(false);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!preview || !bankId) return;

    setImporting(true);
    setError('');
    try {
      const transactions = preview.transactions.map(transaction => ({
        ...transaction,
        bankId,
        type: type === 'auto' ? transaction.type : type,
      }));
      await addBulkTransactions(transactions);
      onImported?.(transactions.length);
      onClose();
    } catch (importError) {
      setError(importError.message || 'Não foi possível concluir a importação.');
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Modal
      title="Importar transações"
      eyebrow="Importação inteligente"
      description="Compatível com CSVs do Nubank, Itaú, Inter e outros bancos."
      onClose={onClose}
      size="large"
    >
      <form onSubmit={handleImport}>
        {!file ? (
          <button
            type="button"
            className={`csv-dropzone ${reading ? 'is-loading' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              readFile(event.dataTransfer.files[0]);
            }}
            disabled={reading}
          >
            {reading ? <Loader2 className="spin" size={30} /> : <UploadCloud size={30} />}
            <strong>{reading ? 'Analisando arquivo...' : 'Arraste seu CSV para cá'}</strong>
            <span>ou clique para escolher no seu dispositivo</span>
            <small>CSV com Data, Descrição e Valor · até 10 MB</small>
          </button>
        ) : (
          <div className="selected-file">
            <span className="file-icon"><FileSpreadsheet size={22} /></span>
            <div>
              <strong>{file.name}</strong>
              <span>{preview.transactions.length} transações reconhecidas</span>
            </div>
            <button type="button" className="icon-button ghost" onClick={clearFile} aria-label="Remover arquivo">
              <X size={18} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(event) => readFile(event.target.files[0])}
        />

        {error && (
          <div className="feedback-message error" role="alert">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        {preview && (
          <>
            <div className="import-summary">
              <span><CheckCircle2 size={17} /> {preview.transactions.length} prontas</span>
              {preview.skippedRows > 0 && <span className="warning">{preview.skippedRows} ignoradas</span>}
              <span>Separador: {preview.delimiter === '\t' ? 'tab' : preview.delimiter}</span>
            </div>

            <div className="csv-preview" aria-label="Prévia das transações">
              {preview.transactions.slice(0, 3).map((transaction, index) => (
                <div className="csv-preview-row" key={`${transaction.description}-${index}`}>
                  <div>
                    <strong>{transaction.description}</strong>
                    <span>{formatShortDate(transaction.date)}</span>
                  </div>
                  <strong>{formatCurrency(transaction.amount)}</strong>
                </div>
              ))}
              {preview.transactions.length > 3 && (
                <div className="preview-more">+ {preview.transactions.length - 3} outras transações</div>
              )}
            </div>

            <div className="form-grid two-columns import-options">
              <div className="form-group">
                <label htmlFor="import-bank">Conta de destino</label>
                <select
                  id="import-bank"
                  className="form-control"
                  value={bankId}
                  onChange={(event) => setBankId(event.target.value)}
                  required
                >
                  <option value="" disabled>Selecione uma conta</option>
                  {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="import-type">Tipo das transações</label>
                <select id="import-type" className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="credit">Cartão de crédito</option>
                  <option value="debit">Débito / Pix</option>
                  <option value="income">Receita</option>
                  <option value="auto">Detectar pelo arquivo</option>
                </select>
              </div>
            </div>
          </>
        )}

        {!banks.length && (
          <div className="feedback-message warning">
            <AlertCircle size={18} /> <span>Cadastre uma conta antes de importar transações.</span>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!preview || !bankId || importing}>
            {importing ? <><Loader2 className="spin" size={18} /> Importando...</> : `Importar ${preview?.transactions.length || ''}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
