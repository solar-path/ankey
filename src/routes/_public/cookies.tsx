import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/cookies')({
  component: Cookies,
})

function Cookies() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your device when you visit our
              website. They help us provide you with a better experience by remembering your
              preferences and understanding how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="mb-4">We use cookies for several purposes:</p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
              <p className="mb-2">
                These cookies are necessary for the website to function and cannot be switched off:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Authentication and security</li>
                <li>Session management</li>
                <li>Load balancing</li>
                <li>Form submission and validation</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Analytics Cookies</h3>
              <p className="mb-2">
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Page views and user navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Error tracking and performance monitoring</li>
                <li>Feature usage analytics</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Functional Cookies</h3>
              <p className="mb-2">
                These cookies enable enhanced functionality and personalization:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Language and region preferences</li>
                <li>Theme and layout settings</li>
                <li>Recently viewed items</li>
                <li>Saved form data</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="mb-4">We may use third-party services that set their own cookies:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Google Analytics:</strong> For website analytics and performance monitoring
              </li>
              <li>
                <strong>Stripe:</strong> For secure payment processing
              </li>
              <li>
                <strong>Intercom:</strong> For customer support and communications
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="mb-4">You have several options for managing cookies:</p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Browser Settings</h3>
              <p className="mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Receive notifications when cookies are set</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Cookie Preferences</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="mb-2">
                  You can manage your cookie preferences for this website using our cookie consent
                  tool.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Update Cookie Preferences
                </button>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Impact of Disabling Cookies</h2>
            <p className="mb-4">
              Please note that disabling certain cookies may affect the functionality of our
              website:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You may not be able to access certain areas of the site</li>
              <li>Some features may not work properly</li>
              <li>Your preferences may not be saved</li>
              <li>You may need to re-enter information more frequently</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. We will notify you of any
              significant changes by posting the new policy on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>Email: privacy@ankey.app</p>
              <p>Address: [Company Address]</p>
            </div>
          </section>
        </div>
      </div>
  )
}
