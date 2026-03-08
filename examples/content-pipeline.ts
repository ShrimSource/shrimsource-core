import { createAgent } from "../src/agent"
import { useTool } from "../src/tool"
import { createWorkflow } from "../src/workflow"
import { runWorkflow } from "../src/runtime"
import { Tool, ToolContext } from "../src/types"

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const generateOutline: Tool = {
    name: "generateOutline",
    description: "根据关键词生成 3 点大纲",
    async run({ state }: ToolContext) {
        const topic = state["input"] as string
        // 模拟 AI 调用
        await sleep(100)
        return [
            `${topic}的背景与发展历程`,
            `${topic}的核心技术原理`,
            `${topic}的未来趋势与应用`
        ]
    }
}

const generateParagraph: Tool = {
    name: "generateParagraph",
    description: "根据大纲要点生成一段文字",
    async run({ input, state }: ToolContext) {
        const { outlineIndex } = input as { outlineIndex: number }
        const outline = state["outline"] as string[]
        const point = outline[outlineIndex]

        // 模拟 AI 调用（偶尔失败以演示 retry）
        await sleep(80 + Math.random() * 120)

        return `【${point}】— 这里是关于"${point}"的详细论述。` +
            `该段落深入探讨了此主题的关键要素，` +
            `并结合实际案例进行了分析说明。`
    }
}

const mergeArticle: Tool = {
    name: "mergeArticle",
    description: "将多个段落合并为完整文章",
    async run({ state }: ToolContext) {
        const topic = state["input"] as string
        const para1 = state["para1"] as string
        const para2 = state["para2"] as string
        const para3 = state["para3"] as string

        return [
            `# ${topic}\n`,
            para1,
            "",
            para2,
            "",
            para3,
            "",
            `— 全文完 —`
        ].join("\n")
    }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    // 1. 创建 Agent（附带生命周期 hooks）
    const agent = createAgent({
        onWorkflowStart: ({ workflowId }) =>
            console.log(`\n[开始] ${workflowId}`),
        onStepStart: ({ stepId }) =>
            console.log(`  → ${stepId}`),
        onStepEnd: ({ stepId }) =>
            console.log(`  ✓ ${stepId}`),
        onStepError: ({ stepId, error }) =>
            console.error(`  ✗ ${stepId}: ${error?.message}`),
        onWorkflowEnd: ({ workflowId }) =>
            console.log(`[完成] ${workflowId}\n`)
    })

    // 2. 注册 Tools
    useTool(agent, generateOutline)
    useTool(agent, generateParagraph)
    useTool(agent, mergeArticle)

    // 3. 定义工作流
    const workflow = createWorkflow(
        [
            { id: "outline", tool: "generateOutline" },
            { id: "para1", tool: "generateParagraph", input: { outlineIndex: 0 }, parallel: true, dependsOn: ["outline"], retry: 2, timeoutMs: 5000 },
            { id: "para2", tool: "generateParagraph", input: { outlineIndex: 1 }, parallel: true, dependsOn: ["outline"], retry: 2, timeoutMs: 5000 },
            { id: "para3", tool: "generateParagraph", input: { outlineIndex: 2 }, parallel: true, dependsOn: ["outline"], retry: 2, timeoutMs: 5000 },
            { id: "merge", tool: "mergeArticle", dependsOn: ["para1", "para2", "para3"] }
        ],
        "content-pipeline"
    )

    // 4. 执行
    const topic = "人工智能"
    console.log(`输入主题: "${topic}"`)

    const result = await runWorkflow(agent, workflow, topic)

    // 5. 输出最终文章
    console.log("=== 生成结果 ===")
    console.log(result.state["merge"])
    console.log(`\n已完成步骤: ${result.completedSteps.join(", ")}`)
}

main().catch(console.error)
