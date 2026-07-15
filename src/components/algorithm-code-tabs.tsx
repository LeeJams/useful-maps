"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

export type AlgorithmCodeExample = {
  language: "Node.js" | "Java" | "Python";
  fileName: string;
  code: string;
};

export function AlgorithmCodeTabs({
  examples,
  label = "언어별 구현 예시"
}: {
  examples: AlgorithmCodeExample[];
  label?: string;
}) {
  const [activeLanguage, setActiveLanguage] = useState(examples[0]?.language ?? "Node.js");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeExample = examples.find((example) => example.language === activeLanguage) ?? examples[0];

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyCode() {
    if (!activeExample) return;

    try {
      await navigator.clipboard.writeText(activeExample.code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  if (!activeExample) return null;

  return (
    <section className="algorithm-code" aria-label={label}>
      <div className="algorithm-code-toolbar">
        <div className="algorithm-code-tabs" role="tablist" aria-label="예제 언어">
          {examples.map((example) => {
            const isActive = example.language === activeLanguage;
            const tabId = `code-tab-${example.language.toLowerCase().replace(".", "-")}`;
            const panelId = `code-panel-${example.language.toLowerCase().replace(".", "-")}`;

            return (
              <button
                aria-controls={panelId}
                aria-selected={isActive}
                className={isActive ? "active" : undefined}
                id={tabId}
                key={example.language}
                onClick={() => {
                  setActiveLanguage(example.language);
                  setCopyState("idle");
                }}
                role="tab"
                type="button"
              >
                {example.language}
              </button>
            );
          })}
        </div>
        <button className="algorithm-copy" onClick={copyCode} type="button">
          {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
          {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사 실패" : "코드 복사"}
        </button>
      </div>
      <div
        aria-labelledby={`code-tab-${activeExample.language.toLowerCase().replace(".", "-")}`}
        className="algorithm-code-panel"
        id={`code-panel-${activeExample.language.toLowerCase().replace(".", "-")}`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="algorithm-code-file">
          <span aria-hidden="true"><i /><i /><i /></span>
          <strong>{activeExample.fileName}</strong>
        </div>
        <pre><code>{activeExample.code}</code></pre>
      </div>
    </section>
  );
}
