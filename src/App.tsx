import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { plugins } from "./plugins/registry";
import { invoke } from "@tauri-apps/api/core"; // 引入 invoke
import { FaSearch, FaArrowLeft, FaRocket } from "react-icons/fa"; // 引入火箭图标代表应用
import "./App.css";

// 定义应用的类型
interface SystemApp {
  name: string;
  path: string;
}

function App() {
  const [view, setView] = useState<string>("launcher");
  const [search, setSearch] = useState("");
  // searchInput 是顶部的搜索框
  const [apps, setApps] = useState<SystemApp[]>([]);
  const ActivePlugin = plugins.find((p) => p.id === view)?.component;
  const activePluginInfo = plugins.find((p) => p.id === view);

  useEffect(() => {
    // 调用 Rust 后端
    invoke<SystemApp[]>("get_system_apps")
      .then((data) => {
        setApps(data);
      })
      .catch((err) => console.error("Failed to load apps:", err));
  }, []);

  // ... 快捷键逻辑不变 (useEffect x2) ...
  useEffect(() => {
    const shortcut = "Alt+Space";
    const setupShortcut = async () => {
      try {
        await unregister(shortcut);
        await register(shortcut, async (event) => {
          if (event.state === "Pressed") {
            const win = getCurrentWindow();
            const isVisible = await win.isVisible();
            if (isVisible) await win.hide();
            else { await win.show(); await win.setFocus(); }
          }
        });
      } catch (err) { console.error(err); }
    };
    setupShortcut();
    return () => { unregister(shortcut); };
  }, []);

  useEffect(() => {
    const handleEsc = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (view === "launcher") await getCurrentWindow().hide();
        else { setView("launcher"); setSearch(""); }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [view]);

  const handleSelect = (pluginId: string) => {
    setView(pluginId);
    setSearch("");
  };

  // 新增：处理应用点击
  const handleLaunchApp = async (path: string) => {
    await invoke("launch_app", { path }); // 调用后端启动
    await getCurrentWindow().hide();      // 启动后自动隐藏窗口
    setSearch("");                        // 清空搜索
  };

  return (
    // 1. 最外层：负责 Padding (避免系统窗口切角)
    <div className="launcher-window">

      {/* 2. 统一卡片容器：负责背景、圆角、边框、阴影 */}
      {/* 这里定义了所有视图共用的外观 */}
      <div className="flex flex-col w-full h-full bg-[#191919]/90 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">

        {/* --- 视图 A: 主启动器 --- */}
        {view === "launcher" && (
          <Command loop className="flex flex-col w-full h-full">

            {/* 顶部搜索栏 */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <FaSearch className="text-gray-500" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="What do you need?"
                autoFocus
                className="flex-1 bg-transparent text-lg text-white placeholder-gray-500 outline-none"
              />
              <div className="text-xs text-gray-600 font-mono border border-gray-700 rounded px-1.5 py-0.5">ESC</div>
            </div>

            {/* 列表区域 */}
            <Command.List className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              <Command.Empty className="p-4 text-center text-gray-500 text-sm">
                No results found.
              </Command.Empty>

              <Command.Group heading="Tools" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 uppercase tracking-wider">
                {plugins.map((plugin) => (
                  <Command.Item
                    key={plugin.id}
                    value={`${plugin.name} ${plugin.keywords.join(" ")}`}
                    onSelect={() => handleSelect(plugin.id)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-gray-300 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                  >
                    <div className="p-2 rounded-md bg-white/5 border border-white/5">
                      <plugin.icon />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{plugin.name}</span>
                      <span className="text-[10px] text-gray-500 opacity-0 aria-selected:opacity-100 transition-opacity">
                        Plugin
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
              {/* === 第二组：应用程序 (新增) === */}
              {/* 只有当 apps 加载完成后才渲染，避免闪烁 */}
              {apps.length > 0 && (
                <Command.Group heading="Applications" className="text-[10px] font-bold text-gray-500 px-2 py-2 uppercase tracking-widest border-t border-white/5 mt-2 pt-2">
                  {apps.map((app) => (
                    <Command.Item
                      key={app.path}
                      value={app.name} // 用于 cmdk 内部过滤
                      onSelect={() => handleLaunchApp(app.path)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all data-[selected=true]:bg-white/10 data-[selected=true]:text-white group"
                    >
                      {/* 暂时使用通用的 App 图标 */}
                      <div className="p-2 rounded-md bg-white/5 border border-white/5 text-gray-400">
                        <FaRocket className="text-lg" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{app.name}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[300px] opacity-60">
                          Application
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

            </Command.List>
          </Command>
        )}

        {/* --- 视图 B: 插件内容 --- */}
        {view !== "launcher" && ActivePlugin && (
             <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-right-4 duration-200">
                 <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/10 shrink-0">
                    <div className="flex items-center gap-2 text-gray-300">
                        <button onClick={() => setView("launcher")} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
                            <FaArrowLeft className="text-sm" />
                        </button>
                        {activePluginInfo && (
                            <span className="text-sm font-semibold flex items-center gap-2">
                                <activePluginInfo.icon className="text-gray-500" />
                                {activePluginInfo.name}
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">ESC to back</div>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <ActivePlugin onBack={() => setView("launcher")} />
                </div>
             </div>
        )}

      </div>
    </div>
  );
}

export default App;