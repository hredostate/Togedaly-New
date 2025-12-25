
import React, { useState, useEffect } from 'react';
import { useToasts } from '../components/ToastHost';
import { supabase } from '../supabaseClient';

interface SMSConfig {
  configured: boolean;
  provider: string;
  sender_id: string;
  api_token: string;
  created_at?: string;
  updated_at?: string;
}

const AdminSmsConfig: React.FC = () => {
  const { add } = useToasts();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [apiToken, setApiToken] = useState('');
  const [senderId, setSenderId] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadConfig();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // ⚠️ SECURITY WARNING: Weak admin authentication
    // Current implementation uses simple email domain check (@togedaly.com)
    // This is NOT secure for production use:
    // - Email can be spoofed or user can create fake account
    // - No proper role-based access control (RBAC)
    // - No audit logging of admin actions
    // - Client-side check can be bypassed
    //
    // TODO: Replace with proper RBAC before production:
    // Option 1: Use Supabase custom claims (requires Auth hook)
    // Option 2: Create admin_roles table with RLS policies
    // Option 3: Use Supabase roles (service_role, authenticated with admin flag)
    // 
    // Implement:
    // - Server-side role verification in API routes
    // - Proper permission scopes (read/write/admin)
    // - Admin action audit logging
    // - Multi-factor authentication for admin accounts
    const admin = user?.email?.endsWith('@togedaly.com') ?? false;
    setIsAdmin(admin);
    
    if (!admin) {
      add({ title: 'Access Denied', desc: 'Admin access required', emoji: '🚫' });
    }
  };

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/sms-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data.configured) {
          setSenderId(data.sender_id);
          // Don't set the masked token
        }
      }
    } catch (error: any) {
      add({ title: 'Error', desc: 'Failed to load SMS configuration', emoji: '⚠️' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (testMode = false) => {
    if (!isAdmin) {
      add({ title: 'Access Denied', desc: 'Admin access required', emoji: '🚫' });
      return;
    }

    if (!apiToken || !senderId) {
      add({ title: 'Validation Error', desc: 'Please fill in all required fields', emoji: '⚠️' });
      return;
    }

    try {
      if (testMode) {
        setTestLoading(true);
      } else {
        setLoading(true);
      }
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/sms-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          api_token: apiToken,
          sender_id: senderId,
          test_phone: testMode ? testPhone : undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        add({ 
          title: 'Success', 
          desc: result.message || 'Configuration saved successfully', 
          emoji: '✅' 
        });
        
        if (!testMode) {
          loadConfig();
          setApiToken('');
        }
      } else {
        add({ 
          title: 'Error', 
          desc: result.error || 'Failed to save configuration', 
          emoji: '⚠️' 
        });
      }
    } catch (error: any) {
      add({ 
        title: 'Error', 
        desc: 'Network error. Please try again.', 
        emoji: '⚠️' 
      });
    } finally {
      setLoading(false);
      setTestLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Configuration</h1>
        <p className="text-gray-600">Configure KudiSMS API for phone authentication</p>
      </div>

      {/* Current Status */}
      {config && (
        <div className={`mb-6 p-4 rounded-xl border ${config.configured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{config.configured ? '✅' : '⚠️'}</span>
            <span className="font-semibold text-gray-900">
              {config.configured ? 'SMS Service Configured' : 'SMS Service Not Configured'}
            </span>
          </div>
          {config.configured && (
            <div className="text-sm text-gray-600 ml-8">
              <div>Provider: {config.provider}</div>
              <div>Sender ID: {config.sender_id}</div>
              <div>Last updated: {config.updated_at ? new Date(config.updated_at).toLocaleString() : 'N/A'}</div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              KudiSMS API Token *
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your KudiSMS API token"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API token from KudiSMS dashboard
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sender ID *
            </label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="Togedaly"
              maxLength={11}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum 11 characters. Must be approved by KudiSMS.
            </p>
          </div>
        </div>
      </div>

      {/* Test SMS */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Test Configuration</h2>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Test Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+234 803 000 0000"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a phone number to send a test message
          </p>
        </div>

        <button
          onClick={() => handleSave(true)}
          disabled={testLoading || !apiToken || !senderId || !testPhone}
          className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {testLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Sending Test...</span>
            </div>
          ) : (
            'Send Test SMS'
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleSave(false)}
          disabled={loading || !apiToken || !senderId}
          className="flex-1 py-4 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>

      {/* Documentation */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-2">📚 Setup Instructions</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Sign up for a KudiSMS account at https://my.kudisms.net</li>
          <li>Get your API token from the KudiSMS dashboard</li>
          <li>Register and get approval for your Sender ID</li>
          <li>Enter the API token and Sender ID above</li>
          <li>Test the configuration with your phone number</li>
          <li>Save the configuration to enable phone authentication</li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Error Codes</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">000</code> - Success</li>
            <li><code className="bg-gray-200 px-1 rounded">100</code> - Invalid Token</li>
            <li><code className="bg-gray-200 px-1 rounded">107</code> - Invalid Phone Number</li>
            <li><code className="bg-gray-200 px-1 rounded">109</code> - Insufficient Balance</li>
            <li><code className="bg-gray-200 px-1 rounded">188</code> - Sender ID Unapproved</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSmsConfig;
