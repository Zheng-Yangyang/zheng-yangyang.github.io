---
title: "Claude code源码学习"
date: 2026-04-14
draft: false
tags: ["Claudecode agent"]
categories: ["agent"]
description: "学习Claude code的源码的设计思想"
ShowToc: true
TocOpen: true
---

什么意思？AI Agent好不好用，不只取决于底层模型多强，更取决于你围绕模型搭建的那套系统有多好。这套系统叫harness（笼具），包括工具调用、权限控制、记忆管理、上下文压缩、安全护栏、多Agent协调……所有让AI从「能力强但不可预测」变成「稳定可靠能交付」的工程组件。

**模型决定了能力上限，harness决定了这个上限能兑现多少。**

为什么选Bun不选Node.jsClaude Code需要频繁启动子进程（每次调用Bash工具就是一个子进程）、大量文件读写（Grep、Glob、Read工具）、处理并发请求（多Agent同时工作）。在这些场景下，Bun的性能比Node.js好不少。

Claude Code的心脏是一个叫TAOR的Agent循环：Think → Act → Observe →Repeat。

![image-20260414212132736](/Users/zyy/Library/Application Support/typora-user-images/image-20260414212132736.png)

你在终端输入一句话后发生的所有事情，都是这个循环在驱动。模型先理解你要什么（Think），然后选一个工具执行操作（Act），观察工具返回的结果（Observe），判断任务是否完成。没完成就回到Think继续。一个任务可能要转几十圈才结束。TAOR不是Claude Code独创的概念，但Claude Code的实现有几个有意思的设计细节：工具调用是唯一的「行动」方式。模型不能直接操作文件系统或运行命令，必须通过工具间接执行。这意味着所有操作都经过一层中间件，可以在这层做权限检查、日志记录、安全审查。这是第5章权限系统的基础。

每次循环都是一次完整的API调用。每个Think-Act周期都需要把当前上下文发给API，等待模型返回工具调用指令，执行后再把结果加入上下文，再发一次API调用。这解释了为什么复杂任务耗费大量token。不是因为模型在「想太多」，而是循环的结构决定了每一步都要把完整上下文发过去。这也是第7章上下文管理如此重要的原因。停止条件是模型自己决定的。循环什么时候停？当模型判断任务完成时，它不再调用工具，直接输出文本回答。这就是为什么给Claude明确的验证标准特别重要。如果需求描述模糊，模型不知道什么时候算「做完了」，循环会一直转下去。

五大子系统 The Five SubsystemsTAOR是骨架，但让Claude Code真正好用的是围绕这个骨架构建的五个子系统：

![image-20260414212235616](/Users/zyy/Library/Application Support/typora-user-images/image-20260414212235616.png)

除了这五个核心子系统，还有几个重要的辅助模块：IDE Bridge：VS Code和JetBrains与CLI之间的双向通信层。用JWT做认证，支持两个方向的消息传递。IDE可以向CLI发任务，CLI也可以向IDE推状态更新。这是Claude Code能同时作为独立CLI和IDE插件运行的基础。上下文管理器：负责在对话变长时进行结构化压缩，以及管理prompt缓存策略。第7章详述。多Agent协调器：管理多个Agent的创建、通信、隔离和结果合并。第9章详述。

![image-20260414212312562](/Users/zyy/Library/Application Support/typora-user-images/image-20260414212312562.png)

![image-20260414212323123](/Users/zyy/Library/Application Support/typora-user-images/image-20260414212323123.png)

看起来简单？实际上，即使是「写一个排序函数」这样的小任务，可能就涉及3-5次TAOR循环，每次循环都是一次完整的API调用。一个复杂任务可能有几十次循环，消耗几万token。但这就是TAOR的魅力：它不是在执行预设的脚本，而是在实时做决策。每一步都在根据最新的观察调整策略。有时候试了一个方案发现不行，回退换另一条路。这不是bug，是设计的一部分。



System Prompt Engineering当你在Claude Code里输入一句话，AI收到的远不止你写的那几个字。你的指令只是冰山一角，水面下是一个庞大的、精心组装的系统提示词。

源码的prompts.ts文件有911行，定义了系统提示词的完整构建过程。核心函数getSystemPrompt()返回的是一个字符串数组，每个元素是一个prompt段落。拼起来就是AI在你发消息前已经读到的所有指令。这些指令分为几大类：

![image-20260414212431189](/Users/zyy/Library/Application Support/typora-user-images/image-20260414212431189.png)
