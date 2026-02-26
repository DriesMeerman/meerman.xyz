---
date: 2025-04-16
title: Exploring the Model Context Protocol
tags:
  - article
  - ai
  - MCP
author: Dries Meerman
ID: "006"
summary: Inspired by recent advancements in agentic AI like VS Code's agent mode and Google's Agent2Agent protocol, the author explores the Model Context Protocol (MCP), an open standard allowing Large Language Models (LLMs) to request external context and utilize tools for more accurate, less hallucinatory results. Motivated to apply this to their ServiceNow expertise, the author developed a custom MCP server (available on GitHub) to retrieve table schemas, detailing the building process using official guides and the MCP Inspector tool for local testing. The article concludes by demonstrating the successful integration of this server into the Cursor editor, where an LLM agent uses the custom tool to fetch live ServiceNow data and generate code based on it, showcasing MCP's potential to enhance AI coding assistants with reliable, real-world context and actions.
---

# Exploring the Model Context Protocol

The VS Code team recently announced their agentic mode, I watched their [video](https://www.youtube.com/watch?v=dutyOc_cAEU) and it got me more excited about AI tooling. Growing competition within AI coding tools, models, even protocols now it seems. With Google [announcing](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) their Agent2Agent protocol.

I'm liking these open standards, allowing you to pick your own models and tools and use them in complexer ways; to do more than just simple gimmicks and with less hallucinations. So with all the movement in the space and Gemini 2.5 pro still being free in preview and GPT 4.1 dropping which is also more focussed on tool use. It got me excited to try and experiment with this new technology.

I have been working with the ServiceNow platform for a long time so a simple and useful thing that popped into my mind is a tool to retrieve table schemas. (Fully original thoughts, not because the VS Code agentic mode video showed the same idea but for Postgres)

You can find the MCP server I created on [Github](https://github.com/DriesMeerman/sn-dev-mcp).

# What is MCP (Model Context Protocol)
For an indepth explanation I can recommend their [documentation website](https://modelcontextprotocol.io/introduction) I got a lot of my information while working on this project from there.
I understand the protocol as follows, we have a model some Large Language Model (LLM) and it needs additional context to do something (without hallucinating, or asking the user). A simple example is databas schema's you are asking the model for some help with an SQL query, but it doesn't know what your table looks like.
MCP is just a standardised way for the LLM to keep working and request this information so it can act upon it.

![mcp no tool structure](./mcp_no_tool_structure.png)

These diagrams show an example of steps that would get moved to the tool. Because the tools supply "real" data the accuracy / usefulness should be better than if its based on memory and requires less manual interaction.

![mcp with tool structure](./mcp_with_tool_structure.png)


Additionally it can also allow your computer to do things instructed by the LLM while still having a layer of safety. For example when your AI powered editor asks to NPM install something, which can then be done by just accepting the tool use. It doesn't give the LLM power to do anything and it gets an answer on the success of it keeping context of what is happening.

# Building an MCP Server
If you are serious about building an MCP yourself you should follow the official [quickstart guide for server developers](https://modelcontextprotocol.io/quickstart/server#node). Alongside this there is a nice collection of [reference MCP servers](https://github.com/modelcontextprotocol/servers) on Github.
So lets assume you did follow the guide and your project builds. How do you run it locally / actually test it?

> *Use the model inspector*

I did it with Node but python should be similar.

```bash
npm run build && \
npx @modelcontextprotocol/inspector node $(pwd)/dist/index.js \
--connection-string https://<USER>:<PASSWORD>@<INSTANCE>.service-now.com
```

So lets break that command down. First we build the MCP server, then we run the inspector. The inspector takes as parameter a string to start the server, so I'm assuming python would work just as well as node here. A full file path to the output of the MCP server, followed by its arguments. Which in my case are named even though the only options is a connection string, containing username password and host.

This starts the inspector which has a nice web UI, which in turn starts the MCP server. If you use claude code, vs code, cursor or something else that will be starting the MCP server.

The inspector is a lot easier during development though, as **you** can be the LLM you've always wanted to be; that uses the tools. Its also nice you don't have to burn through tokens to get an LLM to use your tool for dev purposes.

The inspector feels similar like a Postman or Insomnia[^1].
![mcp_inspector](./mcp_inspector.png)

It has clear in an outputs and you see immediatly whether your tool / resource is working or not. Which you define as part of adherence to the protocol, which is how the LLMs are able to communicate with it.

The arguments past `node path/to/script.js` are arguments handled in the implementation of the MCP Server.

# What now
So what does this all lead to? Hopefully a functioning MCP server, that you can add to a MCP client. Examples of this are some IDE's like VS Code and Cursor, but also Claude code. Look at your client's documentation for the exact specifics, I will explain it for Cursor as that is what I used.

1. Have the repo locally[^2]
2. Open its project folder and `npm install`
3. Build the project: `npm run build`
4. Open the project where you want to use the tool
5. Create `.cursor/mcp.json` and add the following content
	 Make sure to replace the placeholders

```json
{
    "mcpServers": {
        "mcp-sn": {
            "command": "node",
            "args": [
                "/path/to/your/mcp-sn/dist/index.js",
                "--connection-string",
                "https://<USER>:<PASSWORD>@<INSTANCE>.service-now.com"
            ]
        }
    }
}
```

As you can see this is very similar to the arguments we passed to the inspector only in a slightly different format.
Now open your cursor settings and enable the mcp server

![Cursor settings](./cursor_settings.png)
Hopefully we get a nice green dot showing its working.
![MCP active](./mcp_active.png)


# Result
Now you can try a request in the agent chat mode and get live data from the ServiceNow instance you are connected too.
For example as shown here:

![cursor mcp sn task](./cursor_mcp_sn_task.png)

The video[^3] below shows a demo creating a custom table and letting an LLM create scripts to query that table.

<iframe width="560" height="315" src="https://www.youtube.com/embed/dcxhYRUoqpg" title="Model context protocol - LLM interacting with custom ServiceNow Table" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
<br/>


# Closing thoughts
For a new protocol the documentation and existing knowledge on it is quite good and allows you to get started and get something up and running fast.

It does require existing knowledge of LLMs and knowing how REST API's work is a big plus.

I think this space is still getting started and I'm curious to see what kind of tools will become available in the short and long term. To me the tools save user time while increasing result accuracy by preventing hallucinations. This makes the AI tooling a bit more robust.


[^1]: HTTP / REST Client(s)
[^2]: Clone the repo https://github.com/DriesMeerman/sn-dev-mcp.git
[^3]: Unedited video showing tool usage in action [here](https://youtu.be/H0cuVsLqhls)
