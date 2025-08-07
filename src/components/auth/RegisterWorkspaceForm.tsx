import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useDrawer } from '@/components/QDrawer/QDrawer.store';
import { registerSchema, type RegisterData } from '@/shared';

interface RegisterWorkspaceFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  isLoading?: boolean;
}

export function RegisterWorkspaceForm({ onSubmit, isLoading = false }: RegisterWorkspaceFormProps) {
  const { closeDrawer } = useDrawer();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const workspaceName = watch('workspace');

  const handleFormSubmit = async (data: RegisterData) => {
    try {
      await onSubmit(data);
      closeDrawer();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Create Your Workspace</h2>
        <p className="text-gray-600 mt-2">
          Set up your own workspace and start collaborating
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            id="workspace"
            type="text"
            {...register('workspace')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="my-company"
          />
          {workspaceName && (
            <p className="text-sm text-gray-500 mt-1">
              Your workspace will be available at: <strong>{generateSlug(workspaceName)}.localhost:3000</strong>
            </p>
          )}
          {errors.workspace && (
            <p className="text-red-500 text-sm mt-1">{errors.workspace.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            {...register('fullName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
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
            placeholder="Enter a strong password"
          />
          <p className="text-sm text-gray-500 mt-1">
            Must contain uppercase, lowercase, and a number
          </p>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your own dedicated workspace</li>
            <li>• User management and role-based access control</li>
            <li>• Audit logging for compliance</li>
            <li>• Email notifications and invitations</li>
            <li>• $25/user/month billing</li>
          </ul>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Workspace...' : 'Create Workspace'}
        </Button>

        <div className="text-center text-sm text-gray-500">
          By creating a workspace, you agree to our terms of service and privacy policy.
        </div>
      </form>
    </div>
  );
}

// Add metadata for QDrawer
(RegisterWorkspaceForm as any).defaultTitle = 'Create Workspace';
(RegisterWorkspaceForm as any).defaultDescription = 'Set up your new workspace in minutes';