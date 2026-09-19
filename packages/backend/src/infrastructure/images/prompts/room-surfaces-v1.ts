export const ROOM_SURFACES_PROMPT_VERSION = "room-surfaces-v1";
export const roomSurfacesPrompt = (surfaces: string[]) => `Edit this interior room photograph. Preserve the room geometry, lighting, furnishings and all untargeted surfaces. Apply the supplied product references only to: ${surfaces.join(", ")}. Return one photorealistic PNG image without text or watermarks.`;
