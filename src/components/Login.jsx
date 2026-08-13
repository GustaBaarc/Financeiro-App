import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Novos estados para o Cadastro
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Limpa todos os formulários ao trocar de modo
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setBirthDate('');
    setGender('');
  };

  const calculateAge = (dateString) => {
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        // Validação de Idade (+18)
        if (!birthDate) {
          throw new Error('A data de nascimento é obrigatória.');
        }
        
        const age = calculateAge(birthDate);
        if (age < 18) {
          throw new Error('Você deve ter pelo menos 18 anos para criar uma conta.');
        }

        if (!fullName.trim()) {
          throw new Error('O nome completo é obrigatório.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              birth_date: birthDate,
              gender: gender
            }
          }
        });
        
        if (error) throw error;
        
        alert('Conta criada com sucesso! Você já pode entrar.');
        toggleMode(); // Volta para tela de login limpa
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMsg(error.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        padding: '3rem 2.5rem',
        borderRadius: 'var(--border-radius)',
        border: `1px solid var(--border)`,
        width: '100%',
        maxWidth: '460px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: '50%' }}>
            <Wallet size={36} style={{ color: 'var(--primary)' }} />
          </div>
        </div>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>
          {isSignUp ? 'Registre-se para gerenciar suas finanças' : 'Acesse suas finanças pessoais'}
        </p>

        {errorMsg && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: '500', textAlign: 'left', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
          
          {isSignUp && (
            <>
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nascimento *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Sexo</label>
                  <select 
                    className="form-control" 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>E-mail {isSignUp && '*'}</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label>Senha {isSignUp && '*'}</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'Criar Minha Conta' : 'Entrar')}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.95rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </span>
          {' '}
          <button 
            onClick={toggleMode}
            type="button"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: '600', 
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            {isSignUp ? 'Faça Login' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
