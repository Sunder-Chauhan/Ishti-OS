/**
 * Portable, zero-dependency SHA-256 implementation.
 * Safe for client-side webpack bundling and server-side execution.
 */

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export async function sha256Hex(ascii: string): Promise<string> {
  // Use global crypto.subtle if available (browser & modern Node)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(ascii);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fall through to pure JS algorithm below
    }
  }

  // Pure JavaScript SHA-256 algorithm (FIPS PUB 180-4)
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i = 0;
  let j = 0;

  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isPrime[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  let asciiLength = ascii[lengthProperty];
  for (i = 0; i < asciiLength; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << ((3 - (asciiLength % 4)) * 8);
  words[(((asciiLength + 8) >> 6) << 4) + 15] = asciiBitLength;

  const w = new Array(64);
  for (i = 0; i < words.length; i += 16) {
    const wCopy = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[j] + w[j]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + wCopy[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }

  return result;
}
