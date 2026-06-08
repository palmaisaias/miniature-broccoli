import BracketApp from "@/components/BracketApp";
import { getWorldCupGroups } from "@/lib/groups";
import { getSchedule } from "@/lib/schedule";

export default function Home() {
  return <BracketApp groups={getWorldCupGroups()} matches={getSchedule()} />;
}
