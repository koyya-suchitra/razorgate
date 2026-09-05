import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Hash, ExternalLink } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { firebaseUser, displayName, email, photoURL, initials } = useAuth();

  const providerLabel = firebaseUser?.providerData?.[0]?.providerId === 'google.com'
    ? 'Google Account'
    : 'Email & Password';

  const createdDate = firebaseUser?.metadata?.creationTime
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const lastSignIn = firebaseUser?.metadata?.lastSignInTime
    ? new Date(firebaseUser.metadata.lastSignInTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Account</h1>
        <p className="text-sm text-slate-500 mt-1">Your Firebase account details and profile</p>
      </div>

      {/* Avatar + Name */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-semibold">
              {initials}
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<User className="w-4 h-4" />} label="Display Name" value={displayName} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={email} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Sign-in Method" value={providerLabel} />
          <InfoRow icon={<Hash className="w-4 h-4" />} label="User ID" value={firebaseUser?.uid?.slice(0, 16) + '…' || '—'} mono />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Account Created" value={createdDate} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Last Sign-in" value={lastSignIn} />
        </div>
      </div>

      {/* Account type */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">Demo Environment</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Transactions are simulated. No real payments are processed.
            </p>
          </div>
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            Demo
          </span>
        </div>
      </div>

      {/* Firebase Console link */}
      <div className="text-center">
        <a
          href={`https://console.firebase.google.com/project/razorgate-demo`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Firebase Console <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; mono?: boolean }> = ({
  icon, label, value, mono
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-400">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm text-slate-800 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</p>
    </div>
  </div>
);
