import { Suspense } from 'react';
import Loader from '@/components/Loader';
import Post from '@/components/Post';

type Props = {
  params: {
    pageId: string;
  };
};

export default function Page({ params }: Props) {
  return (
    <div>
      <h2>Page {params.pageId}</h2>
      <ol>
        <Suspense
          fallback={
            <li>
              <Loader />
            </li>
          }
        >
          <Post delay={0} />
        </Suspense>
        <Suspense
          fallback={
            <li>
              <Loader />
            </li>
          }
        >
          <Post delay={300} />
        </Suspense>
        <Suspense
          fallback={
            <li>
              <Loader />
            </li>
          }
        >
          <Post delay={600} />
        </Suspense>
        <Suspense
          fallback={
            <li>
              <Loader />
            </li>
          }
        >
          <Post delay={900} />
        </Suspense>
        <Suspense
          fallback={
            <li>
              <Loader />
            </li>
          }
        >
          <Post delay={1200} />
        </Suspense>
      </ol>
    </div>
  );
}
