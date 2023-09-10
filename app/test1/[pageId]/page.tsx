import Post from '@/components/Post';

type Props = {
  params: {
    pageId: string;
  };
};

export default function Page({ params }: Props) {
  return (
    <div>
      <h1>Page {params.pageId}</h1>
      <ol>
        <Post delay={0} />
        <Post delay={300} />
        <Post delay={600} />
        <Post delay={900} />
        <Post delay={1200} />
      </ol>
    </div>
  );
}
