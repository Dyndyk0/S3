export const transformPassword = async (password: string): Promise<string> => {
  const keyHex = process.env.REACT_APP_KEY || "";
  const ivHex = process.env.REACT_APP_IV || "";

  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const ivBytes = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(password);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBytes },
    cryptoKey,
    encoded
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};
