import './globals.css';
import { AuthProvider } from './providers';

export const metadata = {
  title: 'Website Builder',
  description: 'Professional websites with seamless onboarding'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

