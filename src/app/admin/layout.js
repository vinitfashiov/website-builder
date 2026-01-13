import AdminShell from './shell';

export const metadata = {
  title: 'Admin Panel',
  description: 'Manage website builder operations'
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}

