import { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, WalletCards } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getAuthRedirectUrl } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setBirthDate('');
    setGender('');
  };

  const toggleMode = () => {
    setIsSignUp(previous => !previous);
    setIsForgotPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
    resetFields();
  };

  const showLogin = () => {
    setIsSignUp(false);
    setIsForgotPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
  };

  const calculateAge = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
    return age;
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getAuthRedirectUrl('/?recovery=1'),
        });
        if (error) throw error;
        setSuccessMessage('Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.');
      } else if (isSignUp) {
        if (calculateAge(birthDate) < 18) throw new Error('Você precisa ter pelo menos 18 anos para criar uma conta.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/'),
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              birth_date: birthDate,
              gender,
            },
          },
        });
        if (error) throw error;

        if (!data.session) {
          setIsSignUp(false);
          resetFields();
          setSuccessMessage('Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-ambient auth-ambient-one" />
      <div className="auth-ambient auth-ambient-two" />
      <section className="auth-story">
        <div className="auth-brand"><span><WalletCards size={23} /></span> Minhas Finanças</div>
        <div className="auth-copy">
          <span className="eyebrow">Finanças sem complicação</span>
          <h1>Clareza para decidir.<br />Calma para realizar.</h1>
          <p>Organize contas, acompanhe gastos e transforme movimentos do dia a dia em escolhas melhores.</p>
        </div>
        <div className="auth-preview-card">
          <span>Saldo disponível</span>
          <strong>Seu mês em um só lugar</strong>
          <div><i /><i /><i /></div>
        </div>
        <small>Seguro · Privado · Feito para sua rotina</small>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand"><span><WalletCards size={21} /></span> Minhas Finanças</div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="eyebrow">{isForgotPassword ? 'Recuperação segura' : isSignUp ? 'Comece agora' : 'Bem-vindo de volta'}</span>
            <h2>{isForgotPassword ? 'Recupere sua senha' : isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
            <p>{isForgotPassword ? 'Enviaremos um link de redefinição para o seu e-mail.' : isSignUp ? 'Leva menos de dois minutos.' : 'Continue de onde você parou.'}</p>
          </div>

          {errorMessage && <div className="feedback-message error" role="alert"><AlertCircle size={18} /><span>{errorMessage}</span></div>}
          {successMessage && <div className="feedback-message success"><CheckCircle2 size={18} /><span>{successMessage}</span></div>}

          <form className="auth-form" onSubmit={handleAuth}>
            {isSignUp && !isForgotPassword && (
              <>
                <div className="form-group">
                  <label htmlFor="full-name">Nome completo</label>
                  <input id="full-name" type="text" className="form-control" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required />
                </div>
                <div className="form-grid two-columns auth-grid">
                  <div className="form-group">
                    <label htmlFor="birth-date">Nascimento</label>
                    <input id="birth-date" type="date" className="form-control" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gênero <span className="optional">opcional</span></label>
                    <select id="gender" className="form-control" value={gender} onChange={(event) => setGender(event.target.value)}>
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Não binário">Não binário</option>
                      <option value="Prefiro não dizer">Prefiro não dizer</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefone <span className="optional">opcional</span></label>
                  <input id="phone" type="tel" className="form-control" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(00) 00000-0000" autoComplete="tel" />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" required />
            </div>
            {!isForgotPassword && (
              <div className="form-group">
                <div className="password-label-row">
                  <label htmlFor="password">Senha</label>
                  {!isSignUp && <button type="button" onClick={() => { setIsForgotPassword(true); setErrorMessage(''); setSuccessMessage(''); }}>Esqueci minha senha</button>}
                </div>
                <div className="password-field">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><Loader2 className="spin" size={18} /> Aguarde...</> : <>{isForgotPassword ? 'Enviar link seguro' : isSignUp ? 'Criar minha conta' : 'Entrar'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {isForgotPassword ? (
            <p className="auth-switch">Lembrou sua senha?<button type="button" onClick={showLogin}>Voltar ao login</button></p>
          ) : (
            <p className="auth-switch">
              {isSignUp ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'}
              <button type="button" onClick={toggleMode}>{isSignUp ? 'Fazer login' : 'Criar conta grátis'}</button>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
