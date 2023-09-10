import getRandomInt from '@/lib/getRandomInt';
import pauseFunction from '@/lib/pauseFunction';

type Props = {
  delay: number;
};
type Post = {
  userId: string;
  id: number;
  title: string;
  body: string;
};

export default async function Post({ delay }: Props) {
  const randomPostId = getRandomInt(1, 100);
  const url = `https://jsonplaceholder.typicode.com/posts/${randomPostId}`;
  const res = await fetch(url, { cache: 'no-store' });
  const post: Post = await res.json();
  const pause = await pauseFunction(delay);
  return <li>{post.title}</li>;
}
