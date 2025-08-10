// components/Layout.js
// This component is now "smart". It checks the current page route
// and decides whether to show the main application Navbar.

import Navbar from './Navbar';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  // Define the pages that are public and should NOT have the main app Navbar.
  const publicPages = ['/', '/login', '/signup'];
  const isPublicPage = publicPages.includes(router.pathname);

  return (
    <>
      {/* Only render the Navbar if the current page is NOT a public page */}
      {!isPublicPage && <Navbar />}
      <main>{children}</main>
    </>
  );
}