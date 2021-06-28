import { base64ToByteArray, byteArrayToBase64 } from 'lib/utils';
import { useState } from 'react';

const lib = (() => {
  return {
    async generateKeyPair() {
      // generate key pair
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: { name: 'SHA-256' },
        },
        true,
        ['sign', 'verify']
      );
      // export public key to view it
      const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const spkiBytes = new Uint8Array(spkiBuffer);
      const spkiEncoded = byteArrayToBase64(spkiBytes);

      // export private key to view it
      const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const pkcs8Bytes = new Uint8Array(pkcs8Buffer);
      const pkcs8Encoded = byteArrayToBase64(pkcs8Bytes);
      return {
        pkcs8Encoded,
        spkiEncoded,
      };
    },
    async sign(file: File, privateKey: string) {
      let signature: null | string = null;
      const pkcs8Bytes = base64ToByteArray(privateKey);
      // re-create the private key from the byte array
      const pkcs8 = await crypto.subtle.importKey(
        'pkcs8',
        pkcs8Bytes,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const reader = new FileReader();
      reader.onload = async function (e) {
        const blob = reader.result;
        if (blob && typeof blob != 'string') {
          const documentBytes = new Uint8Array(blob);
          const signatureBuffer = await crypto.subtle.sign(
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            pkcs8,
            documentBytes
          );
          const signatureBytes = new Uint8Array(signatureBuffer);
          const singatureEncoded = byteArrayToBase64(signatureBytes);
          signature = singatureEncoded;
        }
      };
      reader.readAsArrayBuffer(file);
      return signature;
    },
    async verify(file: File, publicKey: string, signature: string) {
      let isValid = false;
      // now anyone with the public key can verify that the file was signed by the private key author
      const spkiBytes = base64ToByteArray(publicKey);
      // re-create the public the key from the base64 encoded string
      const spki = await crypto.subtle.importKey(
        'spki',
        spkiBytes,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const reader = new FileReader();
      reader.onload = async function (e) {
        const blob = e.target?.result;
        if (blob && typeof blob != 'string') {
          const documentBytes = new Uint8Array(blob);
          isValid = await crypto.subtle.verify(
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            spki,
            base64ToByteArray(signature),
            documentBytes
          );
        }
      };
      if (file) reader.readAsArrayBuffer(file);
      return isValid;
    },
  };
})();

export default function DigitalSigningAndVerification() {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [signature, setSignature] = useState('');
  const [file, setFile] = useState<null | File>(null);
  const [isValidSignature, setIsValidSignature] = useState<boolean>(false);
  return (
    <div className='max-w-xl mx-auto py-8 grid gap-4'>
      <h1 className='text-2xl font-bold'>Digital Signing {'&'} Verification</h1>
      <h3 className='text-xl font-semibold'>#1 Key Pair Generation</h3>
      <div className='grid gap-2'>
        <button
          className='bg-gray-200 tracking-wide uppercase px-4 py-1 font-semibold'
          onClick={() => {
            (async () => {
              const { pkcs8Encoded, spkiEncoded } = await lib.generateKeyPair();
              setPublicKey(spkiEncoded);
              setPrivateKey(pkcs8Encoded);
            })();
          }}
        >
          Generate Key Pair
        </button>
        <div className='w-full grid gap-1'>
          <label>Public Key</label>
          <textarea className='border px-2 py-1' value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
        </div>
        <div className='w-full grid gap-1'>
          <label>Private Key</label>
          <textarea className='border px-2 py-1' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
        </div>
      </div>
      <h3 className='text-xl font-semibold'>#2 Signing and verification</h3>
      <div className='grid gap-2'>
        <input
          type='file'
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              setFile(files[0]);
            } else {
              setFile(null);
            }
          }}
        />
        <div className='grid gap-1'>
          <label>Digital Signature</label>
          <textarea className='border px-2 py-1' value={signature} onChange={(e) => setSignature(e.target.value)} />
        </div>
        <div className='grid gap-4 grid-cols-2'>
          <button
            className='bg-gray-200 tracking-wide uppercase px-4 py-1 font-semibold'
            onClick={() => {
              (async () => {
                // singing with the private key
                if (file) {
                  const signature = await lib.sign(file, privateKey);
                  if (signature) setSignature(signature);
                }
              })();
            }}
          >
            Sign
          </button>
          <button
            className='bg-gray-200 tracking-wide uppercase px-4 py-1 font-semibold'
            onClick={() => {
              (async () => {
                if (file) {
                  setIsValidSignature(await lib.verify(file, publicKey, signature));
                }
              })();
            }}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
