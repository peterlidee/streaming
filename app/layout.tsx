import Nav from '@/components/Nav';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Routing tests',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <Nav>
          <Link href='/'>home</Link>
          <Link href='/test1'>test 1</Link>
          <Link href='/test2'>test 2</Link>
          <Link href='/test3'>test 3</Link>
          <Link href='/test4'>test 4</Link>
        </Nav>
        {children}
      </body>
    </html>
  );
}
