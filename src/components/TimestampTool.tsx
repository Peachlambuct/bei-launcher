// src/components/TimestampTool.tsx
import { useState, useEffect } from "react";

export default function TimestampTool() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  // 1. 自动更新“当前时间”
  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 转换逻辑
  const handleConvert = (val: string) => {
    setInput(val);
    if (!val) {
      setResult("");
      return;
    }

    // 判断输入是数字（时间戳）还是日期字符串
    const isNum = /^\d+$/.test(val);
    
    if (isNum) {
      // 时间戳转日期 (注意 JS 需要毫秒)
      const date = new Date(parseInt(val) * (val.length === 10 ? 1000 : 1));
      setResult(date.toLocaleString());
    } else {
      // 日期转时间戳
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        setResult((date.getTime() / 1000).toString());
      } else {
        setResult("无效日期格式");
      }
    }
  };

  return (
    <div className="text-white p-4 h-full flex flex-col gap-4">
      {/* 顶部：当前时间 */}
      <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg">
        <span className="text-gray-400 text-sm">当前 Unix 时间戳</span>
        <span className="text-xl font-mono text-green-400">{now}</span>
      </div>

      {/* 转换区域 */}
      <div className="flex-1 flex flex-col gap-2">
        <label className="text-xs text-gray-500 uppercase">转换 (自动识别)</label>
        <input
          autoFocus
          type="text"
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-mono"
          placeholder="输入时间戳 或 2024-01-01..."
          value={input}
          onChange={(e) => handleConvert(e.target.value)}
        />
        
        {/* 结果显示 */}
        {result && (
          <div 
            className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => {
                navigator.clipboard.writeText(result);
                // 这里可以加个简单的 Toast 提示已复制
            }}
          >
            <div className="text-xs text-gray-500 mb-1">结果 (点击复制)</div>
            <div className="font-mono text-blue-300 break-all">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}