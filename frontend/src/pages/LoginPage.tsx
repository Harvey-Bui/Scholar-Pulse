import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pulse } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(import.meta.env.DEV ? 'demo@scholarpulse.app' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-bg text-text px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid place-items-center w-8 h-8 rounded-md border border-accent-600 text-accent-300">
            <Pulse size={18} />
          </span>
          <span className="font-heading font-medium text-lg">Scholar Pulse</span>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          {error && <div className="text-accent-400 text-xs">{error}</div>}
          <Button variant="primary" type="submit" disabled={submitting} className="w-full justify-center mt-2">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="text-center text-neutral-500 text-xs mt-6">
          No account? <Link to="/register">Create one</Link>
        </div>
        {import.meta.env.DEV && (
          <div className="text-center text-neutral-600 text-xs mt-2">Demo: demo@scholarpulse.app / demo1234</div>
        )}
      </div>
    </div>
  );
}
