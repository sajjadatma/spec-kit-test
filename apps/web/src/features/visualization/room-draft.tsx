"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api/client";

type Draft = { floorSelected: boolean; wallSelected: boolean; floorProductId?: string | undefined; wallProductId?: string | undefined; roomAssetId?: string | undefined; revision: number };
type Product = { id: string; name: string; sku: string };
type ProductResponse = { items: Product[] };

export function RoomDraft() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ floorSelected: false, wallSelected: false, revision: 0 });
  const [floorProducts, setFloorProducts] = useState<Product[]>([]);
  const [wallProducts, setWallProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiFetch<Draft>("/visualization/draft"),
      apiFetch<ProductResponse>("/products?selectionSurface=FLOOR"),
      apiFetch<ProductResponse>("/products?selectionSurface=WALL"),
    ]).then(([saved, floor, wall]) => {
      setDraft(saved); setFloorProducts(floor.items); setWallProducts(wall.items);
    }).catch(() => setError("Unable to load the visualization workspace."));
  }, []);

  const save = async (next: Draft) => {
    try { setDraft(await apiFetch<Draft>("/visualization/draft", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })); setError(""); }
    catch { setError("The draft changed elsewhere. Reload and try again."); }
  };
  const selected = (surface: "floor" | "wall") => surface === "floor" ? floorProducts : wallProducts;
  const uploadRoom = async (file: File) => {
    const data = await file.arrayBuffer();
    const preview = await new Promise<{ width: number; height: number }>((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = reject; image.src = URL.createObjectURL(file); });
    const asset = await apiFetch<{ id: string }>("/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentBase64: btoa(String.fromCharCode(...new Uint8Array(data))), mediaType: file.type, width: preview.width, height: preview.height }) });
    const saved = await apiFetch<Draft>(`/visualization/draft/room-asset/${asset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: draft.revision }) });
    setDraft(saved);
  };

  return <section>
    <h1>AI Visualization</h1><label>Room image <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadRoom(file).catch(() => setError("Unable to upload this room image.")); }} /></label>{draft.roomAssetId && <p>Room image attached.</p>}
    <label><input type="checkbox" checked={draft.floorSelected} onChange={(event) => void save({ ...draft, floorSelected: event.target.checked, floorProductId: event.target.checked ? draft.floorProductId : undefined })} /> Floor</label>
    {draft.floorSelected && <label>Floor product <select value={draft.floorProductId ?? ""} onChange={(event) => void save({ ...draft, floorProductId: event.target.value || undefined })}><option value="">Choose a product</option>{selected("floor").map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>}
    <label><input type="checkbox" checked={draft.wallSelected} onChange={(event) => void save({ ...draft, wallSelected: event.target.checked, wallProductId: event.target.checked ? draft.wallProductId : undefined })} /> Wall</label>
    {draft.wallSelected && <label>Wall product <select value={draft.wallProductId ?? ""} onChange={(event) => void save({ ...draft, wallProductId: event.target.value || undefined })}><option value="">Choose a product</option>{selected("wall").map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>}
    <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I consent to use this room image for generation.</label>
    <button disabled={!consent} onClick={async () => { try { const attempt = await apiFetch<{ id: string }>("/visualizations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ consentVersion: "room-surfaces-v1" }) }); router.push(`/visualizations/${attempt.id}`); } catch { setError("Select a compatible product for every selected surface."); } }}>Generate</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
