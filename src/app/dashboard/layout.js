import DashboardShell from './shell';

export const metadata = {
  title: 'Customer Dashboard',
  description: 'Manage your website project'
};

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}

