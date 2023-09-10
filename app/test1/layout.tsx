import Nav from '@/components/Nav';
import Link from 'next/link';

type Props = {
  children: React.ReactNode;
};

export default function layout({ children }: Props) {
  const path = '/test1';
  return (
    <div>
      <h1>Test 1</h1>
      <Nav>
        <Link href={`${path}/1`}>page 1</Link>
        <Link href={`${path}/2`}>page 2</Link>
        <Link href={`${path}/3`}>page 3</Link>
        <Link href={`${path}/4`}>page 4</Link>
        <Link href={`${path}/5`}>page 5</Link>
      </Nav>
      {children}
    </div>
  );
}
