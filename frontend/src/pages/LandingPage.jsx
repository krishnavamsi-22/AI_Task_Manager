import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';
import { Brain, Zap, Users, BarChart3, ArrowRight, Sparkles, Bot, Target } from 'lucide-react';
import api from '../config/api';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [selectedRole, setSelectedRole] = useState('manager');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (modalType === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (modalType === 'signup') {
        const endpoint = selectedRole === 'manager' ? '/api/auth/register/manager' : '/api/auth/register/employee';
        
        await api.post(endpoint, {
          email: formData.email,
          password: formData.password,
          name: formData.name
        });

        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success(`Welcome ${formData.name}! Account created successfully.`);
        navigate(selectedRole === 'manager' ? '/manager' : '/employee');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const idToken = await userCredential.user.getIdToken();
        
        const response = await api.post('/api/auth/login', { idToken });
        
        if (response.data.user.role === selectedRole) {
          toast.success('Login successful!');
          navigate(selectedRole === 'manager' ? '/manager' : '/employee');
        } else {
          toast.error('Invalid role selected');
          await auth.signOut();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold ai-gradient-text">AI TaskFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => openModal('login')} className="ai-button-secondary">
              Sign In
            </button>
            <button onClick={() => openModal('signup')} className="ai-button-primary">
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-700">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="ai-gradient-text">AI-Powered</span>
              <br />
              <span className="text-gray-800">Task Management</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Revolutionize your workflow with intelligent task assignment, real-time performance tracking, and automated team optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="relative overflow-hidden rounded-2xl p-6 text-center group" style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.1)',
              transition: 'all 0.3s'
            }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">AI-Powered Assignment</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Smart task distribution based on skills and performance metrics</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-6 text-center group" style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)',
              transition: 'all 0.3s'
            }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Real-time Analytics</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Live performance tracking and productivity insights</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-6 text-center group" style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)',
              transition: 'all 0.3s'
            }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Instant Updates</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Real-time notifications for all task activities</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-6 text-center group" style={{ 
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.1)',
              transition: 'all 0.3s'
            }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-pink-600/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Team Management</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Comprehensive team oversight and workload monitoring</p>
              </div>
            </div>
          </div>

          <div className="ai-card p-10 text-center" style={{ border: '2px solid rgba(99, 102, 241, 0.15)' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Ready to Get Started?</h2>
            <p className="text-base text-gray-600 mb-6 max-w-xl mx-auto">
              Join teams using AI TaskFlow to boost productivity and streamline operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => openModal('signup')} className="ai-button-primary text-base px-8 py-3 group">
                Create Account
                <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => openModal('login')} className="ai-button-secondary text-base px-8 py-3">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="signup-modal-container animate-slide-up">
            <button className="modal-close-btn" onClick={closeModal}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="signup-modal-header">
              <div className="signup-modal-icon">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="signup-modal-title">
                {modalType === 'login' ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="signup-modal-subtitle">
                {modalType === 'login' ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>
            
            <div className="role-selector-modal">
              <button
                className={`role-btn-modal ${selectedRole === 'manager' ? 'active' : ''}`}
                onClick={() => setSelectedRole('manager')}
              >
                👔 Manager
              </button>
              <button
                className={`role-btn-modal ${selectedRole === 'employee' ? 'active' : ''}`}
                onClick={() => setSelectedRole('employee')}
              >
                👨💼 Employee
              </button>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              {modalType === 'signup' && (
                <div className="form-group-modal">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter your name"
                    className="form-input-modal"
                  />
                </div>
              )}

              <div className="form-group-modal">
                <label>Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="name@company.com"
                  className="form-input-modal"
                />
              </div>

              <div className="form-group-modal">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                  className="form-input-modal"
                />
              </div>

              {modalType === 'signup' && (
                <div className="form-group-modal">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your password"
                    minLength={6}
                    className="form-input-modal"
                  />
                </div>
              )}

              <button type="submit" className="btn-primary-modal" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  modalType === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="signup-modal-footer">
              {modalType === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setModalType('signup')} className="link-btn-modal">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setModalType('login')} className="link-btn-modal">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
