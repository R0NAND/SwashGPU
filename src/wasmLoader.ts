//@ts-ignore
import initWasm from "./wasm/sph.js"; // Import the generated JS file

async function loadWasm() {
  const wasmModule = await initWasm(); // Load WASM
  return wasmModule;
}

export default loadWasm;
