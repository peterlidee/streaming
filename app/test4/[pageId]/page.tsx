import StaticPost from '@/components/StaticPost';

type Props = {
  params: {
    pageId: string;
  };
};

export async function generateStaticParams() {
  const ids = [1, 2, 3, 4, 5];
  return ids.map((id) => ({ pageId: `${id}` }));
}

export default function Page({ params }: Props) {
  return (
    <div>
      <h1>Page {params.pageId}</h1>
      <ol>
        <StaticPost delay={0} />
        <StaticPost delay={300} />
        <StaticPost delay={600} />
        <StaticPost delay={900} />
        <StaticPost delay={1200} />
      </ol>
    </div>
  );
}
