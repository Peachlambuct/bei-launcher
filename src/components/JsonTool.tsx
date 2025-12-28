// src/components/JsonTool.tsx
import { useState } from "react";

export default function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFormat = (val: string) => {
    setInput(val);
    setError(null);
    if (!val.trim()) {
      setOutput("");
      return;
    }

    try {
      const obj = JSON.parse(val);
      // 格式化：缩进 2 空格
      setOutput(JSON.stringify(obj, null, 2));
    } catch (err: any) {
      setError(err.message);
      setOutput(""); // 出错时清空输出，或者保留上次正确结果看你喜好
    }
  };

  return (
    <div className="text-white p-4 h-full flex flex-col gap-2 overflow-hidden">
      <div className="flex gap-2 h-full">
        {/* 左侧输入 */}
        <textarea
          autoFocus
          className="flex-1 bg-gray-800 border border-gray-700 text-xs font-mono text-white rounded-lg p-2 resize-none focus:border-blue-500 outline-none"
          placeholder="粘贴 JSON 字符串..."
          value={input}
          onChange={(e) => handleFormat(e.target.value)}
        />

        {/* 右侧输出 */}
        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 overflow-auto relative group">
           {/* 复制按钮 (浮动) */}
           {output && (
            <button 
                onClick={() => navigator.clipboard.writeText(output)}
                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                Copy
            </button>
           )}

           {error ? (
             <div className="text-red-400 text-xs font-mono break-words">
               {error}
             </div>
           ) : (
             <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap break-all">
               {output}
             </pre>
           )}
        </div>
      </div>
    </div>
  );
}