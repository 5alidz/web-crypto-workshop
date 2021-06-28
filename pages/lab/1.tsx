import { useEffect, useState } from 'react';
import {
  byteArrayToBase64,
  base64ToByteArray,
  byteArrayToHexString,
  hexStringToByteArray,
  stringToByteArray,
} from 'lib/utils';

const lib = (() => {
  return {
    async generateKey() {
      const cryptokey = await crypto.subtle.generateKey(
        {
          name: 'AES-CBC',
          length: 256,
        },
        true,
        ['decrypt', 'encrypt']
      );
      const buffer = await crypto.subtle.exportKey('raw', cryptokey);
      return byteArrayToHexString(new Uint8Array(buffer));
    },
    async encrypt(key: string, plainText: string) {
      const cryptokey = await crypto.subtle.importKey(
        'raw',
        hexStringToByteArray(key),
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt']
      );
      const iv = await crypto.getRandomValues(new Uint8Array(16));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptokey, stringToByteArray(plainText));
      return {
        iv: byteArrayToHexString(iv),
        cipherText: byteArrayToBase64(new Uint8Array(encrypted)),
      };
    },
    async decrypt(IV: string, key: string, ciphertext: string) {
      const cryptokey = await crypto.subtle.importKey(
        'raw',
        hexStringToByteArray(key),
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
      );
      const iv = new Uint8Array(hexStringToByteArray(IV));
      const data = new Uint8Array(base64ToByteArray(ciphertext));
      const resultBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptokey, data);
      return [...new Uint8Array(resultBuffer)].map((n) => String.fromCharCode(n)).join('');
    },
  };
})();

export default function Lab1() {
  const [key, setKey] = useState('');
  const [plainText, setPlainText] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [IV, setIV] = useState('');
  const [decrypted, setDecrypted] = useState('');

  useEffect(() => {
    setPlainText('');
    setCiphertext('');
    setIV('');
    setDecrypted('');
  }, [key]);

  return (
    <div className='max-w-xl mx-auto grid gap-4 py-8'>
      <div className='grid gap-1'>
        <p className='font-semibold text-xl'>#1 Generate Key</p>
        <label>key</label>
        <input className='font-mono border px-2 py-1' value={key} onChange={(e) => setKey(e.target.value)} />
        <button
          className='bg-gray-200 py-1 uppercase font-semibold tracking-wide'
          onClick={() => {
            (async () => {
              const key = await lib.generateKey();
              setKey(key);
            })();
          }}
        >
          genrate key
        </button>
      </div>
      <div className='grid gap-1'>
        <p className='font-semibold text-xl'>#2 Encrypt Message</p>
        <label>plaintext</label>
        <textarea className='border px-2 py-1' value={plainText} onChange={(e) => setPlainText(e.target.value)} />
        <button
          className='bg-gray-200 py-1 uppercase font-semibold tracking-wide'
          onClick={() => {
            (async () => {
              const { cipherText, iv } = await lib.encrypt(key, plainText);
              setIV(iv);
              setCiphertext(cipherText);
            })();
          }}
        >
          encrypt
        </button>
      </div>
      <div className='grid gap-1'>
        <p className='font-semibold text-xl'>#3 Decrypt Message</p>
        <label>IV (initialization vector)</label>
        <input className='border px-2 py-1 font-mono' value={IV} onChange={(e) => setIV(e.target.value)} />
        <label>ciphertext</label>
        <textarea
          className='border px-2 py-1 font-mono'
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
        />
        <button
          className='bg-gray-200 py-1 uppercase font-semibold tracking-wide'
          onClick={() => {
            (async () => {
              const result = await lib.decrypt(IV, key, ciphertext);
              setDecrypted(result);
            })();
          }}
        >
          decrypt
        </button>
        <p>
          <span className='font-mono'>{'=> '}</span>
          <span className='text-green-600 font-semibold'>{decrypted}</span>
        </p>
      </div>
    </div>
  );
}
