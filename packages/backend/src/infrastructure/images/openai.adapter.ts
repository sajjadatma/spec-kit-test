import type { GenerationInput, GenerationOutput, ImageGenerationService } from "./image-generation.js";
import { roomSurfacesPrompt } from "./prompts/room-surfaces-v1.js";

export type ImageEditClient = { edit(input: { model: string; prompt: string; images: Buffer[] }): Promise<Buffer> };
/** Explicitly injected provider client keeps credentials and provider SDKs out of domain code. */
export class OpenAiImageGenerationAdapter implements ImageGenerationService {
  constructor(private readonly client: ImageEditClient, private readonly model: string) {}
  async generate(input: GenerationInput): Promise<GenerationOutput> {
    if (input.deadline <= new Date()) throw new Error("GENERATION_TIMEOUT");
    const surfaces = input.references.map((reference) => reference.surface);
    const image = await this.client.edit({ model: this.model, prompt: roomSurfacesPrompt(surfaces), images: [input.room, ...input.references.map((reference) => reference.image)] });
    if (image.byteLength > 25 * 1024 * 1024) throw new Error("GENERATION_RESULT_INVALID");
    return { image, mediaType: "image/png" };
  }
}
