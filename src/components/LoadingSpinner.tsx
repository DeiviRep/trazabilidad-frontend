export default function LoadingSpinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
