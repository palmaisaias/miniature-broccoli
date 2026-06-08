import { readFileSync } from "fs";
import path from "path";
import type { WorldCupGroup } from "@/components/WorldCupGroups";

export function getWorldCupGroups(): WorldCupGroup[] {
  const filePath = path.join(process.cwd(), "WC Groups.txt");
  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const groups: WorldCupGroup[] = [];

  for (const line of lines) {
    if (/^GROUP\s+[A-Z]$/i.test(line)) {
      groups.push({ name: line.toUpperCase(), teams: [] });
      continue;
    }

    groups[groups.length - 1]?.teams.push(line);
  }

  return groups;
}
