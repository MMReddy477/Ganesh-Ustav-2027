import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <main className="admin-dashboard" aria-busy="true">
      <div className="module-loading admin-route-loading" role="status" aria-live="polite">
        <LoaderCircle size={18} className="animate-spin" />
        Loading Committee Portal…
      </div>
    </main>
  );
}
