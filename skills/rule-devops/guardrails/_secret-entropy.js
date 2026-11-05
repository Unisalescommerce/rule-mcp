/** Calculate Shannon entropy over UTF-8 bytes, as in Betterleaks. */
export function shannonEntropy(value) {
  const bytes = new TextEncoder().encode(value);

  if (bytes.length === 0) {
    return 0;
  }

  const frequencies = new Uint32Array(256);

  for (const byte of bytes) {
    frequencies[byte] += 1;
  }

  let entropy = 0;

  for (const count of frequencies) {
    if (count === 0) {
      continue;
    }

    const probability = count / bytes.length;

    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}
