import { CloudWorkspace } from '@/components/layout/cloud-workspace';
import { DashboardFrame } from '@/components/layout/dashboard-frame';
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <CloudWorkspace><DashboardFrame>{children}</DashboardFrame></CloudWorkspace>; }
