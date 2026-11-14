import fs from "node:fs";
import { createRequire } from "node:module";

// Shared academy art; the two NPC recipes retain their own cloth/trim colors.
export async function createAcademyNpcCrests(color) {
  const require = createRequire(import.meta.url);
  const sharp = createRequire(require.resolve("next/package.json"))("sharp");
  const back = fs.readFileSync(new URL("./assets/academy-crest.svg", import.meta.url), "utf8")
    .replaceAll("#B29A6A", color);
  const chest = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 256 320"><g fill="none" stroke="${color}" stroke-width="10" stroke-linejoin="round"><path d="M38 56Q128 20 218 56V152Q212 232 128 284Q44 232 38 152Z"/><path d="M128 72L136 98L164 100L142 116L150 142L128 126L106 142L114 116L92 100L120 98Z"/><path d="M128 176Q99 157 70 166V216Q104 210 128 234Q152 210 186 216V166Q157 157 128 176ZM128 176V234"/></g></svg>`;
  return Promise.all([back, chest].map(svg => sharp(Buffer.from(svg)).png().toBuffer()));
}
