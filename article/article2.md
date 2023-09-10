# Suspense, client components and static rendering

Up until now, we have been working with dynamically rendered server components. But, there are other options.

## Client components

Client components are components that:

1. Have interactivity and event listeners.
2. Use hooks (f.e. `useState`) or custom hooks.
3. Use browser only API (f.e. localstorage or geolocation)
4. Are Class components.

Can we have `Suspense` in or around client components? No! I added the `use client` directive on top of our `<Post />` component and the entire page lit up with eslint yellow squiggly lines. It had a link to the eslint rule that states clearly:

> Client components cannot be async functions:  
> https://nextjs.org/docs/messages/no-async-client-component

This page has some more links saying it's technically possible to make client components async but very glitchy and complex, so stay away from it. With no async client components, there is no need for `Suspense`.

## Static rendering

We've been using dynamic fetches (with option `{ cache: 'no-store }`). This opts `Next` into dynamic rendering of the entire route. This means that the route is not prerendered at build time (`next build`) but at request time. When the user requests a page, the server prerenders the page and sends it to the client.

Static rendering works differently. The route gets prerendered - server-side - at build time. When the user requests a page, the server serves this prerendered page. The prerendering has already been done. Static rendering is the default in `Next`. Every render is static except when `Next` encounters a dynamic fetch (see above) or dynamic functions (like `headers()` or `cookies()`).

Let's test this out. We will make a new route `/test4` but base our project on `/test2` (the one with `loading.js`). (All files are available on [github](https://github.com/peterlidee/streaming))

As we are working with dynamic pages we need to tell our app what pages we want to generate using the `generateStaticParams` function. (This replaces `getStaticPaths`):

```tsx
// app/test4/[pageId]/page.tsx

export async function generateStaticParams() {
  const ids = [1, 2, 3, 4, 5];
  return ids.map((id) => ({ pageId: `${id}` }));
}

...
```

If you're not quite following: we have a dynamic page: [pageId]. To do static rendering (SSG) we provide `Next` with the routes we want prerendered. For this we use `generateStaticParams` that returns an array of objects with the pageIds:

```ts
[{ pageId: 1 }, { pageId: 2 }, ...]
```

What pages do we want to prerender? Pages 1 to 5. And that is what we did here.

But, we are not finished. Our `<Post />` component uses a dynamic fetch (`{ cache: 'no-store' }`). But, we want a static fetch. So we make a copy of `<Post />` and call it: `<StaticPost />`:

```tsx
// components/StaticPost.tsx

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

export default async function StaticPost({ delay }: Props) {
  const randomPostId = getRandomInt(1, 100);
  const url = `https://jsonplaceholder.typicode.com/posts/${randomPostId}`;
  const res = await fetch(url, { cache: 'force-cache' });
  const post: Post = await res.json();
  const pause = await pauseFunction(delay);
  return <li>{post.title}</li>;
}
```

The only thing we changed was replacing `{ cache: 'no-store' }` with `{ cache: 'force-cache' }`. We could've also omitted it since `force-cache` is the default. Lastly, we of course update our dynamic page with this `<StaticPost />`.

Before we run the test, there is a caveat. We need to run a build. When in development mode, there are no prerendered files and `Next` just runs everything server-side. So, we need to first run `next build` and then `next start`. Then we can test our example in 'production' mode.

Running build confirms our static rendering. The terminal confirms that our `/test4` paths were statically generated (the symbol ● confirms this):

```
└ ● /test4/[pageId]
    ├ /test4/1
    ├ /test4/2
    ├ /test4/3
    └ [+2 more paths]
```

If you are interested you can even look inside the `Next` build folder: `.next/server/app/test4/` and see our 5 prerendered page: `1.html`, `2.html`, ...

Let us now run the app: `next start` and open it in localhost. When we navigate to `test4/1` and go further to 2 and 3, it is clear. Navigation is immediate. There is no loading, there is no waiting. The server serves the prerendered files - as expected. Conclusion: `Suspense` is useless in static rendering? **No.** Let's run some more tests.

## dynamicParams

`Next` SSG has a cool feature. We just told `Next` to prerender pages 1 to 5. But what happens when we were to visit 'page 6' at `test4/6`? In the same file where you use `generateStaticParams` you can export an option named `dynamicParams`:

```tsx
export const dynamicParams = true; // true | false
```

When this option is set to false, opening a route that was not generated by `generateStaticParams` (f.e. `/test4/6`) will generate a 404. But when set to true (the default), `Next` will just prerender this page dynamically and serve it. This page will then exist in the `Next` build folder as `6.html` as if it was prerendered at build time. When you or another user then request this page, it will be served from this prerendered folder, exactly like the other prerendered page (1 to 5). In the old `pages router`, `dynamicParams` was the fallback option to `getStaticPaths`.

Did I hear server-side rendering? Bring in the `Suspense`. Let's update our test to include some non-prerendered links. In `app/test6/layout.tsx` we add links to pages 6 to 10. But, we do not update the `generateStaticParams` with these pages. We do not want to prerender pages 6 to 10. Run build, check terminal logs:

```
└ ● /test4/[pageId]
    ├ /test4/1
    ├ /test4/2
    ├ /test4/3
    └ [+2 more paths]
```

Success, pages 6 to 10 were not prerendered. Run start, navigate to page `/test4/1`, then `/test4/2`. All fine, not loading state. To the new not-prerendered pages: `/test4/6`. Result: no loading state, immediate rendering of the post title. **What?** Same thing for pages 7,8,...

This surprised me. Maybe `Suspense` does not work here? (It does!) Did I do something wrong? (I did not.) Even more surprising. The `Next` build folder now had prerendered files of these new routes: `6.html`, `7.html`, ...

Eventually it clicked. I made a new build, opened the network tab of my browser dev tools, ran start and navigated to route `/test4`. This is what the network tab showed:

[insert image 6]

`Next` had prefetched all the new routes (6 to 10) in the background. On navigating to these routes it then served me prerendered files that were prerendered at _prefetch_ time.

After my initial new build, the `Next` build folder held pages 1 - 5 for route `/test4`. The second I visited this route (and the links appear), `Next` prefetched them. Pages 6 to 10 were now also present in the build folder. How awesome is that!

But, no `Suspense` needed then?

## No prefetching

Well, what happens is that `Next` only prefetches links that are inside the viewport. So, if you were to have maybe a lot of links low down in the page it is possible to run into an unprefetched page. We will simulate this by adding some links with the option prefetch false:

```tsx
// prettier-ignore
<Link href='/test4/11' prefetch={false}>11</Link>
```

`Suspense` needed? Yes. We added 5 more links to pages 11 - 15 with the prefetch false option. Run build and start. When visiting these non-prefetched functions ... the app hangs. It pauses for around 3-ish seconds. Then the address bar and the components update. Our `<Loader />` wasn't visible. So, `loading.tsx` did **not** work!

I can't explain this. I fully expected it to work. After some testing and trying I eventually managed to get a loading state by adding a `loading.js` in the `/test4` folder. (I used a green loading text so I could tell the difference.)

```
/test4
    page.tsx
    layout.tsx
    loading.tsx       (Works)
    /[pageId]
        page.tsx
        loading.tsx   (Does not work)
```

Loading:

[insert image 7]

After loading:

[insert image 8]

Unfortunately I can't explain this. Is this normal behavior or a bug? I don't know. I expected 'normal' behavior for non-prefetched routes, similar to dynamic routes. This did not happen and I can't explain why.

What I can say it that our pages 11 to 15, after being visited did appear in our build folder - as expected.

## Streaming

One last note. `Next` has been updating a lot of its docs lately and while doing some research for this article, I came across some new info. Earlier in this article we talked about dynamic and static server-side rendering.

But in the [recently updated docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components), `Next` now mentions 3 types of server-side rendering:

1. Static: default.
2. Dynamic: when using dynamic functions or dynamic fetches.
3. Streaming: when using loading.js or `Suspense`.

The docs define streaming as:

> With Streaming, routes are rendered on the server at request time. The work is split into chunks and streamed to the client as it becomes ready.
>
> Source: [next docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components#streaming)

That means that we've been talking about `streaming` the whole time. Does this change anything about this article? No, `streaming` is always paired with dynamic rendering. We just explored static rendering and affirmed this. Statically prerendered routes don't need `Suspense`.

## ~~Conclusion~~ Challenge

I can't offer a conclusion about static rendering as I don't know. So instead I will end this bonus chapter in a challenge.

I setup the example, and it is available on [github](https://github.com/peterlidee/streaming). Give it your best shot and see if any of you can explain why `loading.js` is not working as intended in not prerendered, not prefetched routes.

As far as using loading mechanics in your own SSG projects. As I am not sure this is a bug or not, I would say, be very careful.
