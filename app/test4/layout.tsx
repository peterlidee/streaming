import Nav from '@/components/Nav';
import Link from 'next/link';

type Props = {
  children: React.ReactNode;
};

export default function layout({ children }: Props) {
  const path = '/test4';
  return (
    <div>
      <h1>Test 4: Static rendering</h1>
      <div>prerendered pages</div>
      <Nav>
        <Link href={`${path}/1`}>page 1</Link>
        <Link href={`${path}/2`}>page 2</Link>
        <Link href={`${path}/3`}>page 3</Link>
        <Link href={`${path}/4`}>page 4</Link>
        <Link href={`${path}/5`}>page 5</Link>
      </Nav>
      <div>prefetched pages</div>
      <Nav>
        <Link href={`${path}/6`}>page 6</Link>
        <Link href={`${path}/7`}>page 7</Link>
        <Link href={`${path}/8`}>page 8</Link>
        <Link href={`${path}/9`}>page 9</Link>
        <Link href={`${path}/10`}>page 10</Link>
      </Nav>
      <div>not prefetched pages</div>
      <Nav>
        <Link href={`${path}/11`} prefetch={false}>
          page 11
        </Link>
        <Link href={`${path}/12`} prefetch={false}>
          page 12
        </Link>
        <Link href={`${path}/13`} prefetch={false}>
          page 13
        </Link>
        <Link href={`${path}/14`} prefetch={false}>
          page 14
        </Link>
        <Link href={`${path}/15`} prefetch={false}>
          page 15
        </Link>
      </Nav>
      {children}
    </div>
  );
}
