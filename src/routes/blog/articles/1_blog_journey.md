---
title: The journey of starting a blog
tags:
date: 2023-05-28
author: Dries Meerman
---

# The journey of writing a blog

## Why write a blog?

Last year I completed my Master's degree which means no more school essays.
I still enjoy the process of researching a subject and organizing my thoughts, by writing technical articles I want to improve my writing.
Actively researching a topic and crystallizing the thoughts using writing

* improve my writing
* Have an excuse to research things, and force myself to write them out and making them more tangible
* Knowledge sharing

There are also quite a few technical blogs I enjoy reading, and I like to learn how to create similar high quality content.
A good example of this is [Factorio friday facts](https://www.factorio.com/blog/), with a good variety of interesting technical problems and how they solved it.

## Blog requirements

### Control
I want the ability to both integrate the blog into my own website and host on platforms such as medium.
By not being tied to a publishing platform my content will not disappear completely if some platforms go out of business.
In general, I don't like the idea of my content being under the control of others.
This also gives me a great excuse to tinker with my website and add this blogging capability.
Large parts of the web are not faster than they were years ago, even though internet speeds and computing power has gone up significantly.
This is in part because with more processing power there has been more data being sent even in cases where it's not required.
By taking this control I can try to keep the blog fast, nobody likes waiting for a computer.

### Writing Format
There are many programs and file formats that can be used to write in, all of them have their own pro's and con's.
While writing, I might use different computers and mobile devices that makes portability of the format important to me.
I don't want to have to micromanage all parts of the styling, however I want something that looks good without requiring a lot of effort.
I'm comfortable in writing in Markdown which I think is very suitable for blogging as it can easily be transformed into HTML for the web.
The markdown content is still saved as plaintext so it has the portability aspect. Styling content in Markdown is relatively simple if you know the syntax which I happen to already know.
There are many different choices in Markdown editors, I happen to use [Obsidian](https://obsidian.md/) for my own note taking which is a great editor for this purpose.
People usually read blogs on webpages not by downloading Markdown files, a format on its own is not enough.

### RSS feeds
With the changes in management at Twitter microblogging and normal blogging seem to have gotten some more growth.
For myself I'd rather consume short blog articles with deeper content than similar twitter threads.
For that reason I also want to make everything accessible through an RSS feed, as that is how I would like to consume the content.
RSS feeds give people back the control rather than being at the whims of big tech algorithms.
The feed for this blog can be found [here](/feed.xml)


## Solution a custom tech stack
I already have a website I'm happy with, so I prefer to extend that instead of starting another thing which might not get finished.
Luckily there are many libraries / software tools that can help with converting Markdown to HTML or other formats.
This will make it straightforward to implement a system that will turn the Markdown into webpages on my website.
Any future limitations will be there because of choices I made, they can therefore be removed by some effort from my side.
Or if I end up wanting to publish to alternate platforms, turning the Markdown into something that fits a different platform will probably not be too complex.

### Initial plan
Use some existing markdown converter to build html and serve that on my website.
However, setting that up in the existing build pipeline seemed like a lot of more effort than implementing a Svelte markdown renderer.
I looked into completely rebuilding my website as Svelte-kit so that I could have faster pre-rendered pages.
However, that would make the project longer and make it less likely for me to actually finish it.

>Perfect is the enemy of good ~ Voltaire


### Building it

After some googling I found an article that solved a similar problem[^1] rendering Markdown pages in a Svelte website.
Well they used Svelte + Sapper so some modifications where required, however many other solutions I found used SvelteKit which is slightly different from my older Svelte SPA approach.
By using rollup-glob and a rollup Markdown plugin as shown below:
```javascript
import markdown from '@jackfranklin/rollup-plugin-markdown'
import glob from 'rollup-plugin-glob'

export {
    plugins: [  
	   json(),  
	   markdown(),  
	   glob(),  
	   svelte({...})
    ],
    ...
  },
```

I am able to import Markdown files in Svelte components with file globs. While the Markdown plugin also parses the YML frontmatter[^2] metadata which help with for example article dates.
The glob allows me to target multiple files at once, which I use to generate the blog index and render the content on pages.

```jsx
<script>
import articles from './articles/*.md'
export const first = articles[0]
</script>

<div>
{#if first}
	{@html first.html}
{/if}
</div>
```

Now we have the ability to create an overview page from which we can open the other pages, and we can render the markdown content into article pages.
My website was already using the [tailwind](https://tailwindcss.com/) css framework which strips the styling of default tags.
So initially rendered Markdown looked like this:
![Tailwind stripped generated html](assets/articles/1_blog_journey/tailwind_stripped_generated_html.png)

However tailwind already has a solution for this use-case.
By using the [typography plugin](https://tailwindcss.com/docs/typography-plugin) with the prose class and an inverted version for darkmode I was all set.

```jsx
<div class="prose dark:prose-invert max-w-none">  
    {@html post.html}  
</div>
```

![Tailwind fixed generated html](assets/articles/1_blog_journey/tailwind_fixed_generated_html.png)


What is left is an RSS feed so people have the option to stay updated when new posts are added.
The data which is required for an rss feed is already mostly defined in my YML frontmatter.
Because the blog is static and not part of a CMS (Content Management System) we can parse this at build time and generate a static RSS [feed file](https://meerman.xyz/feed.xml).
While this is rather simple I did not feel like writing this script myself so used ChatGPT[^3].
![[chatgpt_blog_rss_generation.png]]
![ChatGPT blog rss feed generation](assets/articles/1_blog_journey/chatgpt_blog_rss_generation.png)

This wrote a script which was 95% correct so with minor modifications I'm ready to merge everything to main and upload my first blog post.
Well mostly the process is not completely automated and there a few minor steps that still need to be adressed.
But rather than trying to be perfect, I will attempt getting something out first and improving it along the way.

## Next steps
While this workflow does what I want it to there are a few missing features or things I want to improve upon.  
1. Images
2. Footnotes

Images are working reasonably well, but when publishing an article there is some manual effort required.
Changing the Obsidian image links in the format of `![[imagename.png]]` to `![Alt text / image name](hosted/imagepath.png)` and copy the images over to an asset folder on the blog part of my website.
Ideally I want to automate this process with some script in the future.  

I'm already using the markdown footnote syntax in this article, however the Markdown parser I'm using it does not support it. 
The markdown footnote syntax is the following `in text[^4]` and then at the end of your article `[^4]: Some footnote`.
So while that is not fixed it will look a bit off.
I found this out after getting most everything to work, so I will need to modify the code to use a different Markdown parser which does support it.
This might have further implications on the current tech used for the blog but that will be a problem for the future.


# Conclusion

Writing can be a good way to get some creativity out and improve your own thought processes.
Taking shortcuts can be okay if it helps you actually finish a project rather getting stuck in trying to finish the last 20%.
Use tools that are available when possible to speed up progress. 
It is easier to add onto something that is finished that to finish something that has been on the back burner for a long time.


# Sources and Notes

[^1]: Creating a markdown blog [Markdown with Sapper](https://dev.to/joshnuss/create-a-blog-with-markdown-sapper-50ad)
[^2]: YML frontmatter is metadata for Markdown files defined at the start of the file between two lines of three dashes.
[^3]: Popular large language model created by Openai (specifically one based on GPT 3.5)  
[^4]: Some footnote