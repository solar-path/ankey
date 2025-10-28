import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from './signin.page';
import { AuthService } from './auth-service';
import { toast } from 'sonner';
import type { User, Session } from '@/modules/shared/types/database.types';

// Mock dependencies
vi.mock('./auth-service');
vi.mock('sonner');
vi.mock('wouter', () => ({
  useLocation: () => ['/auth/signin', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Helper to create mock user
const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  _id: 'user-1',
  type: 'user',
  email: 'test@example.com',
  password: 'hashed-password',
  fullname: 'Test User',
  verified: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Helper to create mock session
const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  _id: 'session-1',
  type: 'session',
  userId: 'user-1',
  token: 'test-token',
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  createdAt: Date.now(),
  ...overrides,
});

describe('SignInPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toast.success).mockImplementation(() => 1);
    vi.mocked(toast.error).mockImplementation(() => 1);
    vi.mocked(toast.info).mockImplementation(() => 1);
  });

  describe('Rendering', () => {
    it('should render sign in form with all fields', () => {
      render(<SignInPage />);

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your credentials to access your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<SignInPage />);

      const forgotPasswordLink = screen.getByText(/forgot your password\?/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password');
    });

    it('should render sign up link', () => {
      render(<SignInPage />);

      const signUpLink = screen.getByText(/sign up/i);
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink.closest('a')).toHaveAttribute('href', '/auth/signup');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for missing password', async () => {
      const user = userEvent.setup();
      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession();

      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        session: mockSession,
        requires2FA: false,
      });

      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(AuthService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(toast.success).toHaveBeenCalledWith('Welcome, test@example.com!');
      });
    });

    it('should show error message when sign in fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';

      vi.mocked(AuthService.signIn).mockRejectedValue(new Error(errorMessage));

      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();

      vi.mocked(AuthService.signIn).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should show 2FA form when 2FA is required', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        requires2FA: true,
      } as any);

      render(<SignInPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
        expect(screen.getByText(/enter the 6-digit code from your authenticator app/i)).toBeInTheDocument();
        expect(toast.info).toHaveBeenCalledWith('Please enter your 6-digit authentication code');
      });
    });

    it('should verify 2FA code successfully', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      const mockSession = createMockSession();

      // First call returns 2FA required
      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        requires2FA: true,
      } as any);

      // Mock 2FA verification
      vi.mocked(AuthService.verify2FA).mockResolvedValue({
        user: mockUser,
        session: {
          token: mockSession.token,
          expiresAt: mockSession.expiresAt,
        },
      } as any);

      render(<SignInPage />);

      // Sign in first
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for 2FA form
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // Enter 2FA code
      const otpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(otpInputs[i], String(i));
      }

      const verifyButton = screen.getByRole('button', { name: /verify and sign in/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(AuthService.verify2FA).toHaveBeenCalledWith('test@example.com', '012345');
        expect(toast.success).toHaveBeenCalledWith('Welcome, test@example.com!');
      });
    });

    it('should show error for invalid 2FA code', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        requires2FA: true,
      } as any);

      vi.mocked(AuthService.verify2FA).mockRejectedValue(new Error('Invalid 2FA code'));

      render(<SignInPage />);

      // Sign in first
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for 2FA form
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // Enter invalid 2FA code
      const otpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(otpInputs[i], '9');
      }

      const verifyButton = screen.getByRole('button', { name: /verify and sign in/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid 2FA code');
      });
    });

    it('should allow going back from 2FA form to sign in', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        requires2FA: true,
      } as any);

      render(<SignInPage />);

      // Sign in first
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for 2FA form
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByRole('button', { name: /back to sign in/i });
      await user.click(backButton);

      // Should return to sign in form
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.queryByText(/two-factor authentication/i)).not.toBeInTheDocument();
      });
    });

    it('should disable verify button until 6 digits are entered', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();

      vi.mocked(AuthService.signIn).mockResolvedValue({
        user: mockUser,
        requires2FA: true,
      } as any);

      render(<SignInPage />);

      // Sign in first
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for 2FA form
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /verify and sign in/i });

      // Button should be disabled initially
      expect(verifyButton).toBeDisabled();

      // Enter only 5 digits
      const otpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 5; i++) {
        await user.type(otpInputs[i], '1');
      }

      // Button should still be disabled
      expect(verifyButton).toBeDisabled();

      // Enter 6th digit
      await user.type(otpInputs[5], '1');

      // Button should now be enabled
      expect(verifyButton).not.toBeDisabled();
    });
  });
});
