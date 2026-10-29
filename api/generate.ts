/* =====================================================================
   /api/generate — función de Vercel para "Suéter 7 — Tu versión"

   Adaptada de app/api/generate/route.ts (versión Cloudflare Workers).
   Corre solo del lado servidor: la key se lee de process.env y nunca
   llega al navegador. La foto llega por FormData, se reenvía a la API de
   imágenes y no se guarda en ningún lado.

   Variables de entorno (Vercel → Settings → Environment Variables):
     OPENAI_API_KEY        obligatoria para generar (sin ella: modo demo)
     OPENAI_IMAGE_MODEL    opcional; por defecto el mismo modelo del original
   ===================================================================== */
import { readFile } from "node:fs/promises";
import path from "node:path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";

/* el sitio también se publica en GitHub Pages: desde ahí se llama a esta función */
const ORIGENES_PERMITIDOS = new Set([
  "https://martoknoll.github.io",
  "https://sueter7-villa-quien.vercel.app",
]);

const scenePrompts: Record<string, string> = {
  colectivo: "The character is sitting beside the window of a Buenos Aires city bus, slightly hunched, looking outside, with a backpack between their legs and one hand resting on it. The bus is shown as a flat navigable 2D room. Outside: low houses, cables, trees and sky.",
  plaza: "The character is sitting on the edge of a bench in a neighborhood plaza in Buenos Aires, looking sideways, with a backpack on the ground. Around them: trees, electrical cables, paths and small floating interface fragments.",
  recital: "The character is standing inside a small crowded concert with one arm raised, moving naturally with the music. Around them: simplified silhouettes, stage lights, cables and abstract interface fragments. Keep the main character clearly visible.",
};

const brandColors: Record<string, string> = {
  azul: "intense blue #2C61B2",
  crema: "aged cream #E7DFD3",
  rojo: "orange-red #D24426",
  amarillo: "warm yellow #E8C229",
  negro: "near-black #090909",
};

const masterPrompt = `
The first input image is only a loose identity reference for the person. The second input image is the visual style reference and must dominate the final art direction.

Transform the person into a simplified 2D avatar belonging to the visual universe shown in the second image. Do not reproduce their face photorealistically. Preserve only a few broad identifiers: hair volume and shape, facial hair if present, overall body build and general face silhouette. The likeness must be low to medium and indirect, not a portrait.

Simplify the character radically: slightly oversized head, compact body, deliberately imperfect proportions, hair as one irregular graphic mass, facial hair as a flat shape, tiny simple eyes, minimal line nose, minimal mouth, geometric hands and clothing built from large flat areas. The character and environment must have exactly the same level of abstraction.

Use only the user-selected colors supplied below. Translate skin, hair, clothes and the environment into those flat brand colors rather than introducing naturalistic tones. Handmade organic lines, rough ink, imperfect printed texture, flat colors, early-2000s personal web graphics, simple obsolete interface windows, cursors, nodes, electrical diagrams, plants and hand-drawn networks. Front-facing flattened perspective, intimate and slightly strange atmosphere.

Do not copy text or logos from the references. No readable text. No photorealistic face, exact facial likeness, skin texture, pores, detailed eyes, individual hair strands, complex facial shading, precise anatomy, realistic lighting, 3D rendering, superhero comic, manga, clean vector art, generic editorial collage or dominant halftone dots.

The final image must look first like an authentic piece from the supplied visual universe and only second like a free representation of the photographed person.
`;

function origenPermitido(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (ORIGENES_PERMITIDOS.has(origin)) return origin;
  // vistas previas de Vercel del mismo proyecto
  if (/^https:\/\/sueter7-villa-quien-[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
  // pruebas locales (fuera de Vercel)
  if (!process.env.VERCEL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return null;
}

function cabecerasCors(request: Request): Record<string, string> {
  const origin = origenPermitido(request);
  return origin
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : { Vary: "Origin" };
}

function json(request: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { ...cabecerasCors(request), "Cache-Control": "no-store" } });
}

/* la referencia de estilo viaja con la función (vercel.json → includeFiles) */
let referenciaEnCache: Blob | null = null;
async function referenciaDeEstilo(request: Request): Promise<Blob> {
  if (referenciaEnCache) return referenciaEnCache;
  try {
    const datos = await readFile(path.join(process.cwd(), "tu-version", "style-reference.png"));
    referenciaEnCache = new Blob([new Uint8Array(datos)], { type: "image/png" });
  } catch {
    const r = await fetch(new URL("/tu-version/style-reference.png", request.url));
    if (!r.ok) throw new Error("No se encontró la referencia de estilo");
    referenciaEnCache = await r.blob();
  }
  return referenciaEnCache;
}

export function OPTIONS(request: Request): Response {
  return new Response(null, { status: 204, headers: cabecerasCors(request) });
}

export function GET(request: Request): Response {
  return json(request, { configured: Boolean(OPENAI_API_KEY) });
}

export async function POST(request: Request): Promise<Response> {
  // desde el navegador, solo se aceptan pedidos del propio sitio
  if (request.headers.get("origin") && !origenPermitido(request)) {
    return json(request, { error: "Origen no permitido." }, 403);
  }
  if (!OPENAI_API_KEY) {
    return json(request, { error: "La generación todavía está en modo demo." }, 503);
  }

  try {
    const incoming = await request.formData();
    const photo = incoming.get("photo");
    const enviada = incoming.get("style_reference");
    const scene = String(incoming.get("scene") ?? "colectivo");
    const requestedPalette = String(incoming.get("palette") ?? "azul,crema,rojo,amarillo,negro")
      .split(",")
      .map((color) => color.trim())
      .filter((color) => color in brandColors);

    if (!(photo instanceof File)) {
      return json(request, { error: "Falta la fotografía o la referencia visual." }, 400);
    }
    const styleReference = enviada instanceof File ? enviada : await referenciaDeEstilo(request);

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(photo.type) || photo.size > 10 * 1024 * 1024) {
      return json(request, { error: "La fotografía debe ser JPG, PNG o WEBP y pesar menos de 10 MB." }, 400);
    }

    const scenePrompt = scenePrompts[scene] ?? scenePrompts.colectivo;
    const palette = [...new Set(requestedPalette)];
    if (palette.length < 2) {
      return json(request, { error: "Elegí por lo menos dos colores de la paleta." }, 400);
    }
    const palettePrompt = `Use ONLY this selected palette: ${palette.map((color) => brandColors[color]).join(", ")}. Do not introduce unselected brand colors or natural skin tones. ${palette.includes("amarillo") ? "Yellow must remain a small accent and must never dominate the image." : "Do not use yellow."}`;
    const openAIForm = new FormData();
    openAIForm.append("model", IMAGE_MODEL);
    openAIForm.append("image[]", photo, photo.name || "person.jpg");
    openAIForm.append("image[]", styleReference, "sueter7-style.png");
    openAIForm.append("prompt", `${masterPrompt}\n\nUSER-SELECTED COLOR PALETTE:\n${palettePrompt}\n\nSCENE AND COMPOSITION:\n${scenePrompt}`);
    openAIForm.append("size", "1536x1024");
    openAIForm.append("quality", "medium");
    openAIForm.append("output_format", "jpeg");
    openAIForm.append("output_compression", "86");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: openAIForm,
    });

    const data = (await response.json()) as { data?: Array<{ b64_json?: string }>; error?: { code?: string } };
    if (!response.ok || !data.data?.[0]?.b64_json) {
      console.error("Image generation failed", data.error?.code ?? response.status);
      return json(request, { error: "No pudimos generar esta imagen. Probá con otra foto o intentá de nuevo." }, response.status >= 400 && response.status < 500 ? 400 : 502);
    }

    return json(request, { image: `data:image/jpeg;base64,${data.data[0].b64_json}` });
  } catch (error) {
    console.error("Unexpected generation error", error);
    return json(request, { error: "Ocurrió un problema inesperado. Probá de nuevo en unos minutos." }, 500);
  }
}
