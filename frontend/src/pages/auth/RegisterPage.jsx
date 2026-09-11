import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, User, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = 'Username is required.';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email is required.';
    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.password_confirm) errs.password_confirm = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await register(formData);
      success('Account created successfully! Welcome to TaskFlow.');
      navigate('/dashboard');
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData) {
        if (typeof responseData === 'object' && !responseData.detail && !responseData.error) {
          const fieldErrs = {};
          Object.keys(responseData).forEach((key) => {
            fieldErrs[key] = Array.isArray(responseData[key]) ? responseData[key][0] : responseData[key];
          });
          setErrors(fieldErrs);
        } else {
          error(responseData.error?.message || responseData.detail || 'Registration failed.');
        }
      } else {
        error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/30 mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create your TaskFlow account
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Join thousands of developers shipping faster with agile sprints
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                placeholder="e.g. Alexander"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
              />
              <Input
                label="Last Name"
                name="last_name"
                placeholder="e.g. Vance"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
              />
            </div>

            <Input
              label="Username"
              name="username"
              icon={User}
              placeholder="e.g. alexvance"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="e.g. alex@company.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                placeholder="Min. 6 chars"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                name="password_confirm"
                type="password"
                icon={Lock}
                placeholder="Repeat password"
                value={formData.password_confirm}
                onChange={handleChange}
                error={errors.password_confirm}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Complete Registration
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
