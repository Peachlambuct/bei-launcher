// src/plugins/registry.tsx
import { FaStickyNote, FaClock, FaCode } from "react-icons/fa";
import EnvRecorder from "./EnvRecorder";
import { Plugin } from "./interface";
import JsonTool from "../components/JsonTool";
import TimestampTool from "../components/TimestampTool";

export const plugins: Plugin[] = [
  {
    id: "env-recorder",
    name: "上线配置备忘 (Deployment Vars)",
    keywords: ["env", "config", "aws", "sqs", "deploy"],
    icon: FaStickyNote,
    component: EnvRecorder,
  },
  {
    id: "time-tool",
    name: "时间戳转换",
    keywords: ["time", "timestamp", "date"],
    icon: FaClock,
    component: TimestampTool,
  },
  {
    id: "json-tool",
    name: "JSON 格式化/扁平化",
    keywords: ["json", "format", "pretty"],
    icon: FaCode,
    component: JsonTool,
  },
];