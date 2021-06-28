import Head from 'next/head';
import Link from 'next/link';

const labs = [
  { title: 'Basic Example', href: '/lab/1' },
  { title: 'Derived Keys from passphrase', href: '/lab/2' },
  { title: 'Digital Signing & Verification', href: '/lab/3' },
];

function Card({ title, href }: { title: string; href: string }) {
  return (
    <li className='px-6 py-4 shadow'>
      <Link href={href}>
        <a className='w-full block'>{title}</a>
      </Link>
    </li>
  );
}

export default function Home() {
  return (
    <div>
      <Head>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='max-w-xl mx-auto py-8 grid gap-8'>
        <h1 className='font-bold text-2xl'>Web Crypto API Examples</h1>
        <ul className='grid gap-4 grid-cols-2'>
          {labs.map(({ href, title }) => (
            <Card href={href} title={title} key={href} />
          ))}
        </ul>
      </main>
    </div>
  );
}
