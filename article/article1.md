# Using loading.js and Suspense in Next 13

`Next 13` introduced build-in mechanisms for displaying loading states:

1. loading.js
2. Suspense

In this article I will explain why they are useful, when and where to use them and which one you should use. We start with looking at a simple example setup.

## The setup

This is what we will be building. All files are available on [github](TODO)

[insert image 1]

We created a new project using `create-next-app` with `TypeScript` and `Eslint`, cleaned out the boilerplate and build a project using the `app router` of course.

At the heart of our project is a post component:

```jsx
// components/Post.tsx
import getRandomInt from '@/lib/getRandomInt';
import pauseFunction from '@/lib/pauseFunction';

type Props = {
  delay: number,
};
type Post = {
  userId: string,
  id: number,
  title: string,
  body: string,
};

export default async function Post({ delay }: Props) {
  const randomPostId = getRandomInt(1, 100);
  const url = `https://jsonplaceholder.typicode.com/posts/${randomPostId}`;
  const res = await fetch(url, { cache: 'no-store' });
  const post: Post = await res.json();
  const pause = await pauseFunction(delay);
  return <li>{post.title}</li>;
}
```

This component makes a api call to [jsonplaceholder](https://jsonplaceholder.typicode.com). It fetches a single post with a random id (an number between 1 and 100):

```jsx
const randomPostId = getRandomInt(1, 100);
const url = `https://jsonplaceholder.typicode.com/posts/${randomPostId}`;
```

This returns an object and from this object we will return the title property:

```tsx
return <li>{post.title}</li>;
```

```ts
// https://jsonplaceholder.typicode.com/posts/1
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat ...",
  "body": "quia et suscipit\nsuscipi ..."
}
```

For the fetch itself, we use the `{ cache: 'no-store' }` option. This tells `Next` to use dynamic fetching: don't use cache, refetch on each request. (similar to `getServerSideProps`).

Finally, we call a `pauseFunction` and we pass it a delay parameter (time in milliseconds). This function returns a promise that gets resolved after `delay` seconds.

```ts
// lib/pauseFunction.ts

export default function pauseFunction(delay: number) {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('Done!');
    }, delay);
  });
  return promise;
}
```

The only thing this function does is pause the component as we call it:

```tsx
const pause = await pauseFunction(delay);
```

Why? So the component takes longer to load and we can observe the loading state better.

In short, `<Post delay={1000} />` makes a dynamic (non cached) fetch and retrieves a random post from the jsonplaceholder api. It then pauses for x milliseconds and finally returns the `post.title`.

We call `<Post />` in a dynamic route 5 times. This gives us an ordered list of 5 titles:

```tsx
// app/test1/[pageId]/page.tsx

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
        <Post delay={0} />
        <Post delay={300} />
        <Post delay={600} />
        <Post delay={900} />
        <Post delay={1200} />
      </ol>
    </div>
  );
}
```

So this page makes 5 request that will have a combined delay of 3000 milliseconds. This gives us ample time to observe loading mechanisms in between page transitions. I added links to different page routes using the layout file.

[insert image 1]

Finally, the different links to _test 1_, _test 2_,... all use the same dynamic page with different loading mechanics:

- `/test1` has no loading mechanic
- `/test2` uses `loading.ts`
- `/test3` uses `Suspense`
- ...

To make this perfectly clear, when we are f.e. on _page 1_ (route `localhost/test2/1`) we can click through to _page 2_ (`localhost/test2/2`) and because of the `pauseFunction` there will be a long loading state that we can easily observe. Being able to do this is the point of this setup.

## No loading mechanism

Let us start with no loading mechanics. We use route `/test1` for this example:

```
/test1
    page.tsx
    layout.tsx
    /[pageId]
        page.tsx  (5 <Post />'s)
```

What happens when we are on `/test1` and we click page 1 which will navigate us to `/test1/1`? Remember, the dynamic page loads `<Post />` 5 times. `<Post />` makes a fetch and calls the `pauseFunction`. The combined paused time is 3 seconds.

The page just hangs for at least 3 seconds. Then the new page loads, the title updates to page 2 and new post titles appear. On top of that. The address bar in your browser also just hangs or freezes the same amount of time. Only after the delay will it update to `http://localhost:3000/test1/1`.

There is no loading state, the browser just waits for the server. This is why `Next`/`React` introduced loading mechanisms. This is why you are here reading this. This new thing is meant to solve this exact issue.

## Why does it take so long

The long freeze we just demonstrated, shows a limitation of server-side rendering. Here is how SSR works. When a request is made:

1. Server fetches all the data.
2. Server renders the HTML.
3. Client downloads the HTML, JS and CSS.
4. Client renders components.
5. Client hydrates app.

All these steps are sequential and blocking. This means that all the data needs to be fetched first. After that is done, the server will render the HTML. Finally, the client will only render after all the data has finished downloading.

The new loading mechanics aim to counter the server limitations. You now have the option to display a loading UI while steps 1 and 2 are taking place.

## Side note

If you are actually running the app instead of just reading along you may have noticed something. Do a reload of the app. Go to `/test1/1` and let load. Navigate to `/test1/2` and let load. Now, click _page 1_ again and observe: _there was no loading._ The page and the address bar immediately update. Back to `/test1/2` and again immediate update.

This means there is caching.

- But didn't we use a dynamic fetch: `{ cache: 'no-store' }` that always refetches the data? Yes we did.
- Then why did it cache? I don't know.
- Did you try it in dev and in prod mode? Yes.
- Different browsers? Yes.
- How long does it cache? As far as I can tell, if you don't visit the page for 30 seconds, a new fetch will be made. Less then 30 seconds and you get a cached result.

I don't know. This was unexpected for me as well. Maybe it's a micro optimization from `Next` but I couldn't find any data on it. Anyway, back to loading mechanics.

## loading.tsx (.js)

Let's first build the example. We take the exact same code we used in `/test1` and put it in `/test2`. Then we simply add a single file `loading.tsx` in `app/test2/[pageId]/`.

```tsx
// app/test2/[pageId]/loading.tsx

import Loader from '@/components/Loader';

export default function Loading() {
  return <Loader />;
}
```

And `<Loader />` simply is some red text:

```tsx
// components/loader.tsx

export default function Loader() {
  return <div style={{ color: 'red' }}>Loading...</div>;
}
```

How does this route behave? When we go from `/test2` to `/test2/1` 3 things happen:

1. The url in the browser address bar immediately updates to `http://localhost:3000/test2/1`.
2. A loading state ('loading...' in red) is displayed below the pages links
   [insert image 2]
3. After about 3 seconds the page updates: it shows the page title: page 1 and a new series of post titles. [insert image 3]

When navigating to other pages in this test, the same happens. The url in the browser changes, the title and ol are replaced with the red 'loading...' text. After 3-ish seconds new data renders.

Here is what happens. `loading.tsx` is a `Next.js` template file. When a server-side request is made and content is not readily available, `Next` will serve `loading.tsx` as a fallback until the server-side rendering (fetching and rendering html) is done. It will then replace `loading.tsx` with the actual content: `page.tsx`.

How does `Next` do this? By using `Suspense` boundary.

## Suspense

> `Suspense` works by wrapping a component that performs an asynchronous action (e.g. fetch data), showing fallback UI (e.g. skeleton, spinner) while it's happening, and then swapping in your component once the action completes.
>
> Source: [next docs](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#example)

Here is an example:

```tsx
<Suspense fallback={<p>Loading feed...</p>}>
  <PostFeed />
</Suspense>
```

In this case `<PostFeed />` makes an asynchronous action (it fetches posts). While `<PostFeed />` is fetching (server-side) `Suspense` serves the client (browser) the fallback: `<p>Loading feed...</p>`. Once the `<PostFeed />` has finished loading, `Suspense` swaps the fallback with `<PostFeed />`.

This should all sound familiar from the example `/test2` we just saw. When using `loading.js`, `Next` wraps `page.tsx` and any of it's children inside `Suspense`.

```tsx
export default function Loading() {
  return <Loader />;
}

// makes Next do:

<Suspense fallback={<Loader />}>
  <Page />
</Suspense>;
```

A remark here. In case you are wondering why the links remain visible during a loading state, that has nothing to do with loading mechanisms but with the `layout.tsx` template file:

> On navigation, layouts preserve state, remain interactive, and do not re-render.

It's not the case here but if we were to have a `layout.tsx` in our `app/test2/[pageId]/` folder, then suspense would still be inside said layout file:

```
/[pageId]
    page.tsx
    layout.tsx
    loading.tsx
```

Would render in the following order:

```tsx
<layout>
  <Suspense fallback={<Loader />}>
    <Page />
  </Suspense>
</layout>
```

Good to know, but, we are not going to do that here.

Also know that while we are using a simple `<Loader />` component (just red text), you can use more complex fallback. For example skeletons that keep your overall layout intact.

## Streaming with Suspense

The `/test2` example we just used illustrates a limitation with using `loading.tsx`. We make 5 fetches yet we have to wait for all of them to be fetched before the server starts rendering any of the html and sending it to the browser. Sure we have a loading state now but it's not optimal.

What we will do now is manually write `Suspense` boundaries around each `<Post />` component (the one that makes the fetch). This removes the server side blocking. Our 5 `<Post />` won't have to wait for each other anymore. When one `<Post />` component has finished fetching, it will get rendered as html and sent to the browser. Independent of the other `<Post />` components.

Let me rephrase this. We know that server-side rendering is render blocking. Our 5 `<Post />` components all need to finish fetching and pausing!! before the server starts rendering the html. The 5 components are treated as one chunk.

But, if we wrap them each inside a `Suspense` boundary, they will no longer be one chunk but 5 smaller and independent chunks. As we gave our `<Post />` components different delays, they will each be sent over and rendered in the browser as soon as they are ready, independent of each other.

Let's build our example `/test3`. It's the same as `/test2` but we remove `loading.tsx`. We then update our dynamic page as such:

```tsx
// prettier-ignore
// app/test3/[pageId]/page.tsx

export default function Profile({ params }: Props) {
  return (
    <div>
      <h2>Page {params.pageId}</h2>
      <ol>
        <Suspense fallback={<Loader />}>
          <li><Post delay={0} /></li>
        </Suspense>
        <Suspense fallback={<Loader />}>
          <li><Post delay={300} /></li>
        </Suspense>
        <Suspense fallback={<Loader />}>
          <li><Post delay={600} /></li>
        </Suspense>
        <Suspense fallback={<Loader />}>
          <li><Post delay={900} /></li>
        </Suspense>
        <Suspense fallback={<Loader />}>
          <li><Post delay={1200} /></li>
        </Suspense>
      </ol>
    </div>
  );
}
```

As you can see, we simply wrapped each `<Post />` in a `Suspense` boundary with the same (red text) loader as fallback. Running the app and navigating between `/test3` pages gives the expected result:

- The url in the browser address bar changes immediately.
- The page title `<h1>Page X</h1>` is rendered immediately.
- We see an ordered list with all items 'Loading...'
  [insert image 4]
- One by one they get filled in with an actual post title.
  [insert image 5]

Even in a very basic example like this, it is a clear ux improvement. On top of that it also has benefits for SEO as it leads to better TTFB, FCP and TTI.

## Conclusion

`Next 13` shifted more responsibilities server-side. But, this shift has drawbacks. In this article we looked into how a server-side fetch is render blocking.

`Next`/`React` provides us with the `Suspense` boundary to handle this issue. `Suspense` wraps a component that performs an asynchronous action (like fetching data), shows a fallback component while it loads and the wrapped component when the loading is complete.

On top of that, `Next` also provides us with the template file `loading.js`. This automatically wraps components with `Suspense` for us. But, it can only be used as part of the `app router` file system.

In the [second part](todo) of this article we will be exploring loading states in client components and static rendering.
