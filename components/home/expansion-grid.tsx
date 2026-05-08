import Link from "next/link";
import { Button } from "@/components/ui/button";

const EXPANSIONS = [
  "OP01", "OP02", "OP03", "OP04", "OP05",
  "OP06", "OP07", "OP08", "OP09",
  "ST01", "ST02", "ST03", "ST04", "ST05",
];

export function ExpansionGrid() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPANSIONS.map((exp) => (
        <Link key={exp} href={`/search?set=${exp}`}>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {exp}
          </Button>
        </Link>
      ))}
    </div>
  );
}
