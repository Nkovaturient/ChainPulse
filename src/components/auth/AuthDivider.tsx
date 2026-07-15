export default function AuthDivider() {
  return (
    <div className="relative flex items-center my-1">
      <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }} />
      <span className="px-3 text-xs" style={{ color: '#8892a4' }}>or</span>
      <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }} />
    </div>
  );
}
