/**
 * DOA Matrix Form Page
 *
 * This is a redirect page that routes to the detail page.
 * The form itself is in doaMatrix.form.tsx
 */

import { useEffect } from "react";
import { useParams, useLocation } from "wouter";

export default function DOAMatrixFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to detail page
    setLocation(`/doa/${id}`);
  }, [id, setLocation]);

  return (
    <div className="container mx-auto py-6">
      <div className="text-center">Redirecting...</div>
    </div>
  );
}
