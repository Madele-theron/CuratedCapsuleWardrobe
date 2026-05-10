import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', type = 'danger' }) {
  if (!isOpen) return null;

  const isAlert = type === 'alert' || type === 'warning';

  const styles = {
    danger: { bg: '#FEF2F2', text: '#DC2626' },
    warning: { bg: '#FFFBEB', text: '#D97706' },
    info: { bg: 'var(--bg-app)', text: 'var(--accent)' }
  }[type] || { bg: '#FEF2F2', text: '#DC2626' };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, alignItems: 'center', justifyContent: 'center' }} onClick={isAlert ? onConfirm : onCancel}>
      <div 
        className="modal-sheet" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '400px', 
          textAlign: 'center', 
          padding: '32px 24px', 
          borderRadius: '16px', 
          border: 'none', 
          boxShadow: 'var(--shadow-lg)' 
        }}
      >
        <div style={{ 
          width: '48px', 
          height: '48px', 
          background: styles.bg, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px',
          color: styles.text
        }}>
          <AlertCircle size={24} />
        </div>
        
        <h2 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'Inter', fontWeight: 600 }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isAlert && (
            <button 
              className="btn-outline" 
              style={{ flex: 1, borderRadius: '8px' }} 
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button 
            className="btn-primary" 
            style={{ 
              flex: 1, 
              borderRadius: '8px', 
              background: styles.text,
              border: 'none'
            }} 
            onClick={onConfirm}
          >
            {isAlert ? 'Got it' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
