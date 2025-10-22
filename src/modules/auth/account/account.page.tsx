import { Link, Route, Switch } from "wouter";
import ProfilePage from "./profile.page";
import SecurityPage from "./security.page";
import { ContactForm } from "./contact.page";

// Wrapper for ContactForm to make it work with Route
const ContactPage = () => <ContactForm />;

export default function AccountPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="flex gap-8">
        <nav className="w-48 space-y-2">
          <Link
            href="/account/profile"
            className="block px-4 py-2 rounded hover:bg-accent"
          >
            Profile
          </Link>
          <Link
            href="/account/security"
            className="block px-4 py-2 rounded hover:bg-accent"
          >
            Security
          </Link>
          <Link
            href="/account/contact"
            className="block px-4 py-2 rounded hover:bg-accent"
          >
            Contact
          </Link>
        </nav>

        <div className="flex-1">
          <Switch>
            <Route path="/account/profile" component={ProfilePage} />
            <Route path="/account/security" component={SecurityPage} />
            <Route path="/account/contact" component={ContactPage} />
            <Route>
              <div>Select a section from the menu</div>
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
}
