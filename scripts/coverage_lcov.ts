interface CoverageRange {
  startOffset: number;
  endOffset: number;
  count: number;
}

interface CoverageFunction {
  ranges: CoverageRange[];
}

interface CoverageEntry {
  url: string;
  functions?: CoverageFunction[];
}

const coverageDir = Deno.env.get("DENO_COVERAGE_DIR") ?? "coverage";
const sourceRootUrl = `${new URL("../src/", import.meta.url)}`;
const lineHits = new Map<string, Map<number, number>>();

function lineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source.charCodeAt(i) === 10) {
      starts.push(i + 1);
    }
  }
  return starts;
}

function bestRangeForLine(
  ranges: CoverageRange[],
  startOffset: number,
): CoverageRange | undefined {
  let best: CoverageRange | undefined;
  for (const range of ranges) {
    if (range.startOffset <= startOffset && startOffset < range.endOffset) {
      if (
        !best ||
        range.endOffset - range.startOffset < best.endOffset - best.startOffset
      ) {
        best = range;
      }
    }
  }
  return best;
}

for await (const entry of Deno.readDir(coverageDir)) {
  if (!entry.isFile || !entry.name.endsWith(".json")) {
    continue;
  }

  const raw = await Deno.readTextFile(`${coverageDir}/${entry.name}`);
  const coverage = JSON.parse(raw) as CoverageEntry;
  if (
    !coverage.url.startsWith(sourceRootUrl) || !coverage.url.endsWith(".ts")
  ) {
    continue;
  }

  const sourcePath = new URL(coverage.url).pathname;
  const source = await Deno.readTextFile(sourcePath);
  const starts = lineStarts(source);
  const ranges = coverage.functions?.flatMap((fn) => fn.ranges) ?? [];
  const fileHits = lineHits.get(sourcePath) ?? new Map<number, number>();

  for (let index = 0; index < starts.length; index += 1) {
    const line = index + 1;
    const text = source.slice(starts[index], starts[index + 1]).trim();
    if (!text) {
      continue;
    }

    const range = bestRangeForLine(ranges, starts[index]);
    if (!range) {
      continue;
    }

    fileHits.set(line, (fileHits.get(line) ?? 0) + range.count);
  }

  lineHits.set(sourcePath, fileHits);
}

let lcov = "";
for (const [sourcePath, hits] of [...lineHits.entries()].sort()) {
  const relativePath = sourcePath.replace(`${Deno.cwd()}/`, "");
  const lines = [...hits.entries()].sort((a, b) => a[0] - b[0]);
  const covered = lines.filter(([, count]) => count > 0).length;

  lcov += "TN:\n";
  lcov += `SF:${relativePath}\n`;
  for (const [line, count] of lines) {
    lcov += `DA:${line},${count}\n`;
  }
  lcov += `LF:${lines.length}\n`;
  lcov += `LH:${covered}\n`;
  lcov += "end_of_record\n";
}

if (!lcov) {
  console.error("No source coverage data found in coverage/");
  Deno.exit(1);
}

await Deno.writeTextFile(`${coverageDir}/lcov.info`, lcov);
