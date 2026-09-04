import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#060608' }}>
      <StaffSidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  );
}
