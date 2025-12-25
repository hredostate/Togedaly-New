
import React, { useState, useEffect } from 'react';
import { useToasts } from '../components/ToastHost';

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
  
  const [apiToken, setApiToken] = useState('');
  const [senderId, setSenderId] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sms-config', {
        headers: {
          'Authorization': 'Bearer dummy-token' // In production, use real JWT
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
      
      const response = await fetch('/api/admin/sms-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token' // In production, use real JWT
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
              >
                {showToken ? '👁️' : '👁️‍🗨️'}
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
