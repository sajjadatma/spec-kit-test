"use client";
import { useState } from "react";
import { apiFetch } from "../../lib/api/client";
export function SessionDeleteDialog({ sessionId, onDeleted }: { sessionId: string; onDeleted(): void }) { const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); if(!open)return <button onClick={()=>setOpen(true)}>Delete session</button>; return <div role="dialog" aria-modal="true" aria-label="Delete visualization session"><p>This permanently removes the session history and its private results.</p><button onClick={()=>setOpen(false)} disabled={busy}>Cancel</button><button onClick={async()=>{setBusy(true);try{await apiFetch(`/visualizations/${sessionId}`,{method:"DELETE"});onDeleted()}finally{setBusy(false)}}} disabled={busy}>Confirm deletion</button></div>; }
