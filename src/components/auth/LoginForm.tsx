import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useDrawer } from '@/components/QDrawer/QDrawer.store';
import { loginSchema, type LoginData } from '@/types';

interface LoginFormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  isLoading?: boolean;
  isTenant?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false, isTenant = false }: LoginFormProps) {
  const { closeDrawer } = useDrawer();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const showTwoFactor = watch('email') && watch('password');

  const handleFormSubmit = async (data: LoginData) => {
    try {
      await onSubmit(data);
      closeDrawer();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Sign In {isTenant ? 'to Workspace' : 'as Admin'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isTenant 
            ? 'Access your workspace account'
            : 'Access the admin control panel'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
            Two-Factor Code (if enabled)
          </label>
          <input
            id="twoFactorCode"
            type="text"
            {...register('twoFactorCode')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          {errors.twoFactorCode && (
            <p className="text-red-500 text-sm mt-1">{errors.twoFactorCode.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              // TODO: Open forgot password form
              console.log('Open forgot password form');
            }}
          >
            Forgot Password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {isTenant && (
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                // TODO: Open "Let me in" form
                console.log('Open let me in form');
              }}
            >
              Don't have access? Request Access
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

// Add metadata for QDrawer
(LoginForm as any).defaultTitle = 'Sign In';
(LoginForm as any).defaultDescription = 'Enter your credentials to access your account';