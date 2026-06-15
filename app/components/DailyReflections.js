"use client";

function formatDate(value) {
  if (!value) {
    return "";
  }
  return value.replaceAll("-", " / ");
}

function getSummary(content) {
  if (!content) {
    return "";
  }
  const text = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length > 76 ? `${text.slice(0, 76)}...` : text;
}

export default function DailyReflections({ reflections }) {
  if (!reflections.length) {
    return <div className="empty-state">暂无日常心得</div>;
  }

  return (
    <div className="daily-board">
      {reflections.map((item) => (
        <details className="daily-entry" key={item.id}>
          <summary>
            <span className="daily-date">{formatDate(item.reflection_date)}</span>
            <span className="daily-preview">
              {item.title ? `${item.title}：` : ""}
              {getSummary(item.content)}
            </span>
            <span className="daily-arrow" aria-hidden="true" />
          </summary>
          <div className="daily-full">
            {item.title ? <b>{item.title}</b> : null}
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
            {item.image_urls?.length ? (
              <div className="daily-images">
                {item.image_urls.map((url, index) => (
                  <a href={url} target="_blank" rel="noreferrer" key={url}>
                    <img src={url} alt={`心得图片 ${index + 1}`} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
