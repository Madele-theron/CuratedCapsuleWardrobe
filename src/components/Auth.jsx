import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else if (isRegistering) {
      setMsg({ type: 'success', text: 'Check your email for the confirmation link!' });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', fontFamily: 'Inter, sans-serif' 
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#2A2826', fontSize: '28px', letterSpacing: '1px' }}>STUDIO NORTH STAR</h1>
          <p style={{ color: '#706C67', fontSize: '13px', marginTop: '8px' }}>Sign in to your curated capsule dashboard.</p>
        </div>

        <form onSubmit={handleLogin}>
          {msg && (
            <div style={{ 
              padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px',
              background: msg.type === 'error' ? '#FFF0F0' : '#F0FBF4',
              color: msg.type === 'error' ? '#A83B3B' : '#2E7D32',
              border: `1px solid ${msg.type === 'error' ? '#f8d7da' : '#c3e6cb'}`
            }}>
              {msg.text}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 500 }}>Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', background: '#2A2826', color: 'white', border: 'none', padding: '14px', 
              borderRadius: '8px', fontWeight: 600, marginTop: '16px', cursor: 'pointer', fontSize: '15px' 
            }}
          >
            {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
          <span style={{ color: '#706C67' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          </span>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', color: '#9C7E5E', fontWeight: 600, cursor: 'pointer' }}
          >
            {isRegistering ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
