// Generated at 2024-09-22T00:42:01.375Z
const articlesString = `[
  {
    "filename": "dr-001.md",
    "title": "The journey of starting a blog",
    "tags": [
      "svelte",
      "blog",
      "markdown"
    ],
    "summary": "In this article, the author reflects on their journey of starting a blog after completing their Master's degree, driven by a desire to enhance their writing skills, conduct research, and share knowledge. They discuss the essential requirements for their blog, including the need for control over its hosting, a preferred Markdown format for writing, and the implementation of RSS feeds for content distribution. Choosing a custom tech stack, they extended their existing website using Rollup, Svelte, and Markdown plugins while improving the appearance with Tailwind CSS. They automated RSS feed generation with the help of ChatGPT, although future enhancements, such as automating image publishing and addressing Markdown footnotes, are considered. The article concludes with a reminder to prioritize project completion over perfection and to utilize available tools for efficiency.",
    "date": "2023-05-28T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 1,
    "url": "https://meerman.xyz/#/blog/dr-001"
  },
  {
    "filename": "dr-002.md",
    "title": "Finishing projects",
    "tags": [
      "process"
    ],
    "summary": "This article explores the common issue of unfinished side projects and suggests techniques to overcome it. The author discusses the challenge of side projects losing momentum over time due to the absence of external pressures like deadlines. They emphasize the importance of completing projects, as it hones valuable skills, allows for user feedback, and frees up mental space for creativity. The 'Cult of Done Manifesto' is referenced to underscore the significance of finishing. To prevent projects from languishing, the author recommends preparation, cheating by using existing components, setting clear goals, and collaborating with others. These strategies help maintain focus, enhance productivity, and increase the likelihood of project completion. Ultimately, the article acknowledges that there is no foolproof solution but suggests that these techniques have proven effective for the author in finishing more projects.",
    "date": "2023-09-25T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 2,
    "url": "https://meerman.xyz/#/blog/dr-002"
  },
  {
    "filename": "dr-003.md",
    "title": "Hybrid automation for one-off tasks",
    "tags": [
      "process",
      "automation",
      "ChatGPT",
      "scripting"
    ],
    "date": "2023-10-04T00:00:00.000Z",
    "author": "Dries Meerman",
    "ID": 3,
    "summary": "The blog post titled 'Hybrid Automation' explores a practical approach to combining automation and manual tasks to achieve optimal efficiency. The author introduces the concept of hybrid automation, where automation is applied to tasks that are easily automated, and manual tasks are retained if they are not too tedious and don't benefit significantly from automation. The post delves into the Pareto Principle, commonly known as the 80/20 rule, where 80% of outcomes come from 20% of causes, emphasizing the efficient use of resources. The author provides a real-life example involving the automated downloading of images from a website and explains how they leveraged the ChatGPT tool to simplify the process. They describe the creation of scripts for obtaining image links, copying the data to the clipboard, and a bash script for downloading the images. The post concludes by highlighting the benefits of breaking tasks into manageable components that can be easily automated or manually executed to bridge gaps effectively.",
    "url": "https://meerman.xyz/#/blog/dr-003"
  },
  {
    "filename": "dr-004.md",
    "title": "Swift 5.9 - TL;DR",
    "tags": [
      "Swift"
    ],
    "date": "2024-01-13T00:00:00.000Z",
    "author": "Dries Meerman",
    "summary": "Swift 5.9, released with Xcode 15.2, introduces significant language improvements, including bi-directional C++ compatibility, macros, and the use of 'if' and 'switch' as expressions for more readable code. Debugging sees a speed boost, particularly in 'p' and 'po' commands, and there are notable enhancements to the Swift Package Manager and the Swift-syntax project. The author is particularly excited about the potential for cleaner code with 'if' expressions and the anticipated improvements in code analysis tools. This update also brings advancements for Swift on Windows platforms.",
    "ID": 4,
    "url": "https://meerman.xyz/#/blog/dr-004"
  }
]`;
export const articles = JSON.parse(articlesString);
