import { byteArrayToHexString, hexStringToByteArray, stringToByteArray } from 'lib/utils';
import { useState } from 'react';

const lib = (() => {
  const saveFile = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  };
  const salt = Math.random().toString(16).slice(2, 10);
  return {
    async deriveKeyFromPassPhrase(passphrase: string) {
      const iterations = 10000000;
      const saltBytes = stringToByteArray(salt);
      const passphraseBytes = stringToByteArray(passphrase);

      const baseKey = await crypto.subtle.importKey('raw', passphraseBytes, { name: 'PBKDF2' }, false, ['deriveKey']);
      const cryptoKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
        baseKey,
        {
          name: 'AES-CBC',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );
      return cryptoKey;
    },
    async encryptFile(file: File, passphrase: string) {
      const key = await this.deriveKeyFromPassPhrase(passphrase);
      const reader = new FileReader();
      reader.onload = async function (e) {
        const ivBytes = await crypto.getRandomValues(new Uint8Array(16));
        const result = e.target?.result;
        if (result && typeof result != 'string') {
          const plaintextBytes = new Uint8Array(result);
          const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: ivBytes }, key, plaintextBytes);
          // create blob with the iv
          const blob = new Blob([ivBytes, new Uint8Array(cipherBuffer)], { type: file.type });
          const blobURL = URL.createObjectURL(blob);
          saveFile(blobURL, 'encrypted-' + file.name);
        } else {
          throw new Error('no file to encrypt');
        }
      };
      // start the process
      reader.readAsArrayBuffer(file);
    },
    async decryptFile(file: File, passphrase: string) {
      const key = await this.deriveKeyFromPassPhrase(passphrase);
      const reader = new FileReader();
      reader.onload = async function (e) {
        // decrypt
        const result = e.target?.result;
        if (result && typeof result != 'string') {
          const ivBytes = result.slice(0, 16);
          const cipherBuffer = result.slice(16);
          const resultBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, key, cipherBuffer);
          const blob = new Blob([resultBuffer], { type: file.type });
          const blobURL = URL.createObjectURL(blob);
          saveFile(blobURL, 'decrypted-' + file.name);
        }
      };
      // start the process
      reader.readAsArrayBuffer(file);
    },
  };
})();

export default function Lab2() {
  const [passPhrase, setPassPhrase] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'encrypting' | 'decrypting' | 'encrypted' | 'decrypted' | 'enc-error' | 'dec-error'
  >('idle');
  const [file, setFile] = useState<null | File>(null);

  return (
    <div className='max-w-xl mx-auto grid gap-4 py-8'>
      <p className='font-semibold text-xl'>Password-based key derivation</p>
      <div className='grid gap-2'>
        <label>Enter pass phrase</label>
        <input className='border px-2 py-1' value={passPhrase} onChange={(e) => setPassPhrase(e.target.value)} />
      </div>
      <div>
        <input
          type='file'
          onChange={(e) => {
            const files = e.target.files;
            if (files != null) {
              setFile(files[0]);
            } else {
              setFile(null);
            }
          }}
        />
      </div>
      <div className='grid grid-cols-2 gap-8'>
        <button
          className='bg-gray-200 px-2 py-1 uppercase tracking-wide font-semibold'
          onClick={() => {
            (async () => {
              if (file) {
                try {
                  setStatus('encrypting');
                  await lib.encryptFile(file, passPhrase);
                  setStatus('encrypted');
                } catch (e) {
                  setStatus('enc-error');
                }
              } else {
                alert('no file to encrypt');
              }
            })();
          }}
        >
          encrypt
        </button>
        <button
          className='bg-gray-200 px-2 py-1 uppercase tracking-wide font-semibold'
          onClick={() => {
            (async () => {
              if (file) {
                try {
                  setStatus('decrypting');
                  await lib.decryptFile(file, passPhrase);
                  setStatus('decrypted');
                } catch (e) {
                  setStatus('dec-error');
                }
              } else {
                alert('no file to decrypt');
              }
            })();
          }}
        >
          decrypt
        </button>
      </div>
      <div>{status}</div>
    </div>
  );
}
