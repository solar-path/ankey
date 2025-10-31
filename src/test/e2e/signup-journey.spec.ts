/**
 * E2E Test - Complete Sign Up Journey
 *
 * Tests the complete user journey from sign up to dashboard access using Playwright.
 * Includes verification, sign in, and basic navigation.
 */

import { test, expect, type Page } from '@playwright/test';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique test email
 */
function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Get verification code from database or email (mock for testing)
 * In production, this would fetch from test database or email service
 */
async function getVerificationCode(email: string): Promise<string> {
  // For testing purposes, return a mock code
  // In real tests, query the test database
  // Example: SELECT verification_code FROM users WHERE email = $1
  return '123456';
}

/**
 * Fill sign up form
 */
async function fillSignUpForm(
  page: Page,
  data: { fullname: string; email: string; password: string }
) {
  await page.fill('[name="fullname"]', data.fullname);
  await page.fill('[name="email"]', data.email);
  await page.fill('[name="password"]', data.password);
  await page.check('[name="terms"]');
}

/**
 * Fill sign in form
 */
async function fillSignInForm(page: Page, data: { email: string; password: string }) {
  await page.fill('[name="email"]', data.email);
  await page.fill('[name="password"]', data.password);
}

// ============================================
// COMPLETE SIGN UP JOURNEY
// ============================================

test.describe('Complete Sign Up Journey', () => {
  test('should complete full sign up, verification, and sign in flow', async ({ page }) => {
    const testData = {
      fullname: 'Test User',
      email: generateTestEmail(),
      password: 'SecurePassword123!',
    };

    // ============================================
    // STEP 1: Navigate to sign up page
    // ============================================
    await page.goto('/auth/signup');

    // Verify page loaded
    await expect(page.locator('h1, h2')).toContainText(/sign up/i);

    // ============================================
    // STEP 2: Fill sign up form
    // ============================================
    await fillSignUpForm(page, testData);

    // Verify form fields are filled
    await expect(page.locator('[name="fullname"]')).toHaveValue(testData.fullname);
    await expect(page.locator('[name="email"]')).toHaveValue(testData.email);
    await expect(page.locator('[name="terms"]')).toBeChecked();

    // ============================================
    // STEP 3: Submit sign up form
    // ============================================
    await page.click('button[type="submit"]');

    // Wait for redirect to verification page
    await page.waitForURL('**/auth/verify-account**', { timeout: 10000 });

    // Verify we're on verification page
    await expect(page.locator('h1, h2')).toContainText(/verif/i);

    // ============================================
    // STEP 4: Enter verification code
    // ============================================
    // In a real test, fetch the code from database or email
    const verificationCode = await getVerificationCode(testData.email);

    // Enter code (might be individual digit inputs or single input)
    const codeInput = page.locator('[name="code"]');
    if (await codeInput.count() > 0) {
      await codeInput.fill(verificationCode);
    } else {
      // If using individual digit inputs
      for (let i = 0; i < verificationCode.length; i++) {
        await page.locator(`[data-digit="${i}"]`).fill(verificationCode[i]);
      }
    }

    // ============================================
    // STEP 5: Submit verification
    // ============================================
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForTimeout(1000);

    // Verify success (might redirect to sign in or show success message)
    const currentUrl = page.url();
    const hasSuccessMessage = await page.locator('text=/verified/i').count() > 0;

    expect(currentUrl.includes('/auth/signin') || hasSuccessMessage).toBe(true);

    // ============================================
    // STEP 6: Navigate to sign in (if not already there)
    // ============================================
    if (!currentUrl.includes('/auth/signin')) {
      await page.goto('/auth/signin');
    }

    await expect(page.locator('h1, h2')).toContainText(/sign in/i);

    // ============================================
    // STEP 7: Sign in with verified account
    // ============================================
    await fillSignInForm(page, {
      email: testData.email,
      password: testData.password,
    });

    await page.click('button[type="submit"]');

    // ============================================
    // STEP 8: Verify redirect to dashboard
    // ============================================
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');

    // Verify user information is displayed
    await expect(page.locator('body')).toContainText(testData.fullname);

    // ============================================
    // STEP 9: Verify user is authenticated
    // ============================================
    // Check for user menu or profile element
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]');
    await expect(userMenu).toBeVisible({ timeout: 5000 });

    // Verify localStorage has session token
    const sessionToken = await page.evaluate(() => localStorage.getItem('session-token'));
    expect(sessionToken).toBeTruthy();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/auth/signup');

    // ============================================
    // Test invalid email
    // ============================================
    await page.fill('[name="fullname"]', 'Test User');
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.check('[name="terms"]');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible();

    // ============================================
    // Test weak password
    // ============================================
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show password error
    await expect(page.locator('text=/password.*least.*8/i')).toBeVisible();

    // ============================================
    // Test missing terms agreement
    // ============================================
    await page.fill('[name="password"]', 'SecurePass123');
    await page.uncheck('[name="terms"]');

    await page.click('button[type="submit"]');

    // Should show terms error
    await expect(page.locator('text=/terms|agree/i')).toBeVisible();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const existingEmail = 'existing@example.com';
    // Note: In real test, this email should already exist in test database

    await page.goto('/auth/signup');

    await fillSignUpForm(page, {
      fullname: 'Test User',
      email: existingEmail,
      password: 'SecurePass123',
    });

    await page.click('button[type="submit"]');

    // Should show error about existing email
    await expect(page.locator('text=/already.*exists/i')).toBeVisible({ timeout: 5000 });

    // Should remain on sign up page
    expect(page.url()).toContain('/auth/signup');
  });
});

// ============================================
// SIGN UP FORM INTERACTIONS
// ============================================

test.describe('Sign Up Form Interactions', () => {
  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/signup');

    const passwordInput = page.locator('[name="password"]');
    const toggleButton = page.locator('[aria-label="Toggle password visibility"], button:has-text("Show")');

    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle
    await toggleButton.click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have working "Already have account?" link', async ({ page }) => {
    await page.goto('/auth/signup');

    // Click sign in link
    await page.click('text=/already.*account/i');

    // Should navigate to sign in
    await page.waitForURL('**/auth/signin**');
    await expect(page.locator('h1, h2')).toContainText(/sign in/i);
  });

  test('should disable submit button during submission', async ({ page }) => {
    await page.goto('/auth/signup');

    const submitButton = page.locator('button[type="submit"]');

    await fillSignUpForm(page, {
      fullname: 'Test User',
      email: generateTestEmail(),
      password: 'SecurePass123',
    });

    // Click submit
    await submitButton.click();

    // Button should be disabled during request
    await expect(submitButton).toBeDisabled();
  });
});

// ============================================
// VERIFICATION PAGE TESTS
// ============================================

test.describe('Verification Page', () => {
  test('should focus first digit input on load', async ({ page }) => {
    await page.goto('/auth/verify-account');

    // First input should be focused
    const firstInput = page.locator('[data-digit="0"], [name="code"]').first();
    await expect(firstInput).toBeFocused();
  });

  test('should auto-advance between digit inputs', async ({ page }) => {
    await page.goto('/auth/verify-account');

    // Check if using individual digit inputs
    const digitInputs = page.locator('[data-digit]');
    const count = await digitInputs.count();

    if (count === 6) {
      // Type in each digit
      await digitInputs.nth(0).type('1');
      await expect(digitInputs.nth(1)).toBeFocused();

      await digitInputs.nth(1).type('2');
      await expect(digitInputs.nth(2)).toBeFocused();

      await digitInputs.nth(2).type('3');
      await expect(digitInputs.nth(3)).toBeFocused();
    }
  });

  test('should show error for invalid verification code', async ({ page }) => {
    await page.goto('/auth/verify-account');

    // Enter invalid code
    const codeInput = page.locator('[name="code"]');
    if (await codeInput.count() > 0) {
      await codeInput.fill('999999');
    }

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid.*code/i')).toBeVisible();
  });

  test('should have "Resend code" functionality', async ({ page }) => {
    await page.goto('/auth/verify-account');

    const resendButton = page.locator('button:has-text("Resend")');

    if (await resendButton.count() > 0) {
      await resendButton.click();

      // Should show success message
      await expect(page.locator('text=/sent|resent/i')).toBeVisible();
    }
  });
});

// ============================================
// ACCESSIBILITY TESTS
// ============================================

test.describe('Accessibility', () => {
  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth/signup');

    // All inputs should have labels
    const fullnameInput = page.locator('[name="fullname"]');
    const emailInput = page.locator('[name="email"]');
    const passwordInput = page.locator('[name="password"]');

    await expect(fullnameInput).toHaveAttribute('aria-label');
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/signup');

    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="fullname"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="password"]')).toBeFocused();
  });
});

// ============================================
// RESPONSIVE DESIGN TESTS
// ============================================

test.describe('Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/auth/signup');

    // Form should be visible and usable
    await expect(page.locator('form')).toBeVisible();

    // Should be able to fill form
    await fillSignUpForm(page, {
      fullname: 'Mobile User',
      email: generateTestEmail(),
      password: 'SecurePass123',
    });

    // Submit button should be visible
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/auth/signup');

    // Form should be visible and usable
    await expect(page.locator('form')).toBeVisible();
  });
});
