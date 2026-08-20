import { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, WalletCards } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function PasswordRecovery({ onComplete, invalidReason = '' }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use pelo menos 8 caracteres na nova senha.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas informadas não são iguais.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message || 'Não foi possível atualizar sua senha.');
    else {
      window.history.replaceState({}, document.title, window.location.pathname);
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <main className="recovery-page">
      <section className="recovery-card">
        <div className="auth-mobile-brand recovery-brand"><span><WalletCards size={21} /></span> Minhas Finanças</div>
        <div className={`recovery-icon ${invalidReason ? 'invalid' : ''}`}>{success ? <CheckCircle2 size={27} /> : invalidReason ? <AlertCircle size={27} /> : <LockKeyhole size={27} />}</div>
        <span className="eyebrow">Recuperação de acesso</span>
        <h1>{success ? 'Senha atualizada' : invalidReason ? 'Link inválido ou expirado' : 'Crie uma nova senha'}</h1>
        <p>{success ? 'Sua nova senha já está ativa e sua sessão continua protegida.' : invalidReason || 'Escolha uma senha forte que você ainda não utiliza em outros serviços.'}</p>

        {invalidReason ? (
          <button type="button" className="btn btn-primary recovery-submit" onClick={onComplete}>Solicitar um novo link</button>
        ) : success ? (
          <button type="button" className="btn btn-primary recovery-submit" onClick={onComplete}>Ir para meu painel</button>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="feedback-message error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
            <div className="form-group">
              <label htmlFor="new-password">Nova senha</label>
              <div className="password-field">
                <input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Pelo menos 8 caracteres" required autoFocus />
                <button type="button" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirme a nova senha</label>
              <input id="confirm-password" type={showPassword ? 'text' : 'password'} className="form-control" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Digite novamente" required />
            </div>
            <button type="submit" className="btn btn-primary recovery-submit" disabled={loading}>
              {loading ? <><Loader2 className="spin" size={18} /> Atualizando...</> : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
