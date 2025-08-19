// c:\Users\happy\Git Uploads\stratus\src\app\layout.js
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Stratus',
  description: 'Your Stratus Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
