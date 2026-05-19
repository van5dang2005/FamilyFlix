import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Mail, Database, ExternalLink } from 'lucide-react';
import { seedDatabase } from '../../seedData';
import { useAuth } from '@/src/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginUser } = useAuth();
  
  React.useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const msg = await seedDatabase();
      alert(msg);
    } catch (err: any) {
      alert("Failed to seed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return
    try { 
      setIsSubmitting(true)
      await loginUser(email, password);
      navigate('/profiles');
    } catch {
      alert('Login failed')
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleGoogleLogin = async () => {
    
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 p-8 rounded-lg border border-zinc-800"
      >
        <h1 className="text-3xl font-bold text-red-600 mb-8 text-center tracking-tighter">FAMILYFLIX</h1>
        
        {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <LogIn size={20} />
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-white underline"
          >
            Đăng ký
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-sm">OR</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          {isInIframe && (
            <p className="text-[10px] text-zinc-500 mt-2 text-center italic">
              Note: Popups may be blocked in preview. Use "Open in New Tab" if login fails.
            </p>
          )}

          {isInIframe && (
            <div className="mt-8 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Trouble logging in?</p>
              <p className="text-zinc-400 text-sm mb-4">Google login often fails inside an iframe. Try opening the app in a new tab.</p>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition flex items-center justify-center gap-2 text-sm"
              >
                <ExternalLink size={16} /> Open in New Tab
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
