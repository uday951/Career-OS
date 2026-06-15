import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useStore();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code parameter returned from Google.');
      return;
    }

    const connectGmail = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.post(`${API_BASE}/api/outreach/gmail/callback`, { code }, config);
        setStatus('success');
        setTimeout(() => {
          navigate('/settings?gmail=connected');
        }, 1500);
      } catch (err) {
        console.error('Gmail OAuth Callback error:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Failed to complete Gmail connection.');
      }
    };

    if (token) {
      connectGmail();
    }
  }, [token, searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-md mx-auto space-y-4 text-center">
      {status === 'processing' && (
        <>
          <Loader2 className="animate-spin text-primary hover:scale-105 transition-transform" size={40} />
          <h2 className="text-lg font-bold text-slate-800">Connecting Gmail Account...</h2>
          <p className="text-xs text-slate-500">Exchanging credentials and establishing secure API channel.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="text-success animate-scale-up" size={44} />
          <h2 className="text-lg font-bold text-slate-800">Connection Successful!</h2>
          <p className="text-xs text-slate-500">Your Gmail account is now linked. Redirecting you back to settings...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="text-danger animate-scale-up" size={44} />
          <h2 className="text-lg font-bold text-slate-800">Connection Failed</h2>
          <p className="text-xs text-danger font-medium mt-1">{errorMsg}</p>
          <button 
            onClick={() => navigate('/settings')} 
            className="btn-primary text-xs mt-4 px-5 py-2.5"
          >
            Return to Settings
          </button>
        </>
      )}
    </div>
  );
}
