import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import {
  FaTrash,
  FaSave,
  FaLayerGroup,
  FaKey,
  FaDatabase,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";

// 定义存储的数据结构
interface EnvItem {
  id: string;
  key: string;
  value: string;
  type: "ENV" | "AWS" | "SQL";
  desc: string;
}

const STORE_PATH = "env_records.json";

export default function EnvRecorder({ onBack: _onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<EnvItem[]>([]);
  const [newItem, setNewItem] = useState({
    key: "",
    value: "",
    desc: "",
    type: "ENV",
  });

  // --- 新增：搜索状态 ---
  const [searchQuery, setSearchQuery] = useState("");

  // 加载数据
  useEffect(() => {
    const initStore = async () => {
      const store = await load(STORE_PATH);
      const val = await store.get<EnvItem[]>("records");
      if (val) setItems(val);
    };
    initStore();
  }, []);

  // 保存数据
  const saveItem = async () => {
    if (!newItem.key) return;
    const store = await load(STORE_PATH);
    const updated = [
      ...items,
      { ...newItem, id: Date.now().toString(), type: newItem.type as any },
    ];
    await store.set("records", updated);
    await store.save();
    setItems(updated);
    setNewItem({ ...newItem, key: "", value: "" }); // 保留类型，只清空内容
  };

  const deleteItem = async (id: string) => {
    const store = await load(STORE_PATH);
    const updated = items.filter((i) => i.id !== id);
    await store.set("records", updated);
    await store.save();
    setItems(updated);
  };

  // 根据类型获取图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "AWS":
        return <FaLayerGroup className="text-orange-400" />;
      case "SQL":
        return <FaDatabase className="text-blue-400" />;
      default:
        return <FaKey className="text-green-400" />;
    }
  };

  // --- 新增：过滤逻辑 ---
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.key.toLowerCase().includes(query) ||
      (item.value && item.value.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col h-full text-gray-200">
      {/* --- 输入区域 (添加新配置) --- */}
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="flex gap-3">
          {/* 类型选择 */}
          <div className="relative group w-24">
            <select
              className="w-full appearance-none bg-[#1e1e1e] border border-white/10 text-xs rounded-md py-2.5 px-3 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
            >
              <option value="ENV">ENV</option>
              <option value="AWS">AWS</option>
              <option value="SQL">SQL</option>
            </select>
          </div>

          {/* Key 输入 */}
          <input
            className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-md px-3 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            placeholder="Key / Resource Name"
            value={newItem.key}
            onChange={(e) => setNewItem({ ...newItem, key: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && saveItem()}
          />

          {/* Value 输入 */}
          <input
            className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-md px-3 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            placeholder="Value (Optional)"
            value={newItem.value}
            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && saveItem()}
          />

          {/* 保存按钮 */}
          <button
            onClick={saveItem}
            disabled={!newItem.key}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 rounded-md transition-all active:scale-95 flex items-center justify-center"
          >
            <FaSave className="text-sm" />
          </button>
        </div>
      </div>

      {/* --- 新增：搜索过滤栏 --- */}
      {items.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5 bg-black/10">
          <div className="relative group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-400 transition-colors text-xs" />
            <input
              type="text"
              className="w-full bg-transparent border border-transparent focus:border-white/5 rounded-md py-1.5 pl-8 pr-8 text-xs text-gray-300 placeholder-gray-600 outline-none transition-all focus:bg-white/5"
              placeholder="Filter by key or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* 快速清除按钮 */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
              >
                <FaTimesCircle className="text-xs" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- 列表区域 --- */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm opacity-60">
            {items.length === 0 ? (
              <>
                <p>暂无记录</p>
                <p className="text-xs mt-1">输入配置后按 Enter 保存</p>
              </>
            ) : (
              <p>无搜索结果</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
              >
                {/* 图标列 */}
                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center shrink-0 border border-white/5">
                  {getTypeIcon(item.type)}
                </div>

                {/* 文本内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* 高亮搜索匹配项 (可选高级功能，这里保持简单只显示文本) */}
                    <span className="font-mono text-sm text-gray-200 truncate select-all">
                      {item.key}
                    </span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">
                      {item.type}
                    </span>
                  </div>
                  {item.value && (
                    <div className="text-xs text-gray-500 truncate mt-0.5 font-mono select-all">
                      {item.value}
                    </div>
                  )}
                </div>

                {/* 操作栏 (Hover时显示) */}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                  title="Delete"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
