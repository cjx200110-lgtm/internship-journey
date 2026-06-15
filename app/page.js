import HeroOrbit from "@/app/components/HeroOrbit";
import DailyReflections from "@/app/components/DailyReflections";
import { getLatestMonthlyReport, getReflections } from "@/lib/data";

export const dynamic = "force-dynamic";

const fallbackReport = {
  overview_lines: [
    "完成重点任务的信息梳理、需求确认和阶段性推进。",
    "沉淀过程文档、问题记录和汇报材料。",
    "在多任务协作中持续优化沟通节奏、优先级判断和个人复盘方法。"
  ],
  reflections: [
    {
      title: "任务理解",
      example: "接到较模糊的任务时，先确认目标、交付标准和关键时间点。",
      analysis: "前期把问题拆清楚，后续执行会更稳定，也更容易和团队保持同频。"
    },
    {
      title: "沟通协作",
      example: "在同步进展时补充背景、当前状态和下一步计划。",
      analysis: "清晰的上下文能减少反复确认，让协作效率更高。"
    }
  ],
  todo_items: [
    { title: "持续记录", detail: "保持日常心得沉淀。" },
    { title: "及时复盘", detail: "按阶段整理问题和经验。" },
    { title: "明确交付", detail: "提前确认目标与标准。" }
  ]
};

function RichContent({ html }) {
  return <span className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

async function loadPageData() {
  try {
    const [report, reflections] = await Promise.all([
      getLatestMonthlyReport(),
      getReflections()
    ]);

    return {
      report: report || fallbackReport,
      reflections
    };
  } catch {
    return {
      report: fallbackReport,
      reflections: []
    };
  }
}

export default async function HomePage() {
  const { report, reflections } = await loadPageData();

  return (
    <div className="page">
      <section className="hero" id="top" aria-label="工作总结首屏">
        <div className="stage">
          <HeroOrbit />
          <div className="center-copy">
            <h1>工作总结</h1>
            <a className="cta" href="#report">
              <span className="cta-arrow" aria-hidden="true" />
              查看本月总结
            </a>
          </div>
        </div>
      </section>

      <main>
        <section className="section" id="report">
          <div className="section-head">
            <h2>月度工作报告</h2>
          </div>
          <div className="poster-wrap">
            <article className="poster" aria-label="月度工作报告">
              <div className="poster-inner">
                <section className="overview-block">
                  <h3>本月工作概况</h3>
                  <div className="overview-lines">
                    {report.overview_lines.map((line, index) => (
                      <div className="overview-line" key={`${line}-${index}`}>
                        <i>{index + 1}</i>
                        <RichContent html={line} />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="reflection-block">
                  <h3>总结与反思</h3>
                  <div className="reflection-list">
                    {report.reflections.map((item) => (
                      <div className="reflection-item" key={item.title}>
                        <b>{item.title}</b>
                        <div className="reflection-text">
                          <span className="label">事例：</span>
                          <RichContent html={item.example} />
                        </div>
                        <div className="reflection-text">
                          <span className="label">分析：</span>
                          <RichContent html={item.analysis} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="todo-block">
                  <h3>To do list</h3>
                  <div className="todo-list">
                    {report.todo_items.map((item, index) => (
                      <div className="todo-item" key={`${item.title}-${index}`}>
                        <i>{index + 1}</i>
                        <div>
                          <b>{item.title}</b>
                          <RichContent html={item.detail} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </article>
          </div>
        </section>

        <section className="section" id="daily">
          <div className="section-head">
            <h2>日常心得体会</h2>
          </div>
          <DailyReflections reflections={reflections} />
        </section>
      </main>
    </div>
  );
}
