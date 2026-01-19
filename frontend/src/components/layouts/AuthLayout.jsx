import { Brain } from 'lucide-react';
import './AuthLayout.css';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      {/* Left Side - Visual/Branding */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="auth-brand-title">AI TaskFlow</h1>
            <p className="auth-brand-tagline">Intelligent Task Management for Modern Teams</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Card */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">{title}</h2>
            {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
