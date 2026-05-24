import { strict as assert } from "node:assert";
import { format, parse, validateIDL } from "../src/webidl_service.ts";

Deno.test("webidl_service parses a simple interface", () => {
  const idl = "interface Foo { };";
  const tree = parse(idl, "test.webidl");
  assert.ok(Array.isArray(tree));
  assert.equal(tree.length, 1);
  assert.ok("name" in tree[0]);
  assert.equal(tree[0].name, "Foo");
});

Deno.test("webidl_service applies autofixes and returns parseable IDL", () => {
  const idl = "interface Foo{attribute boolean bar;};";
  const formatted = format(idl, "test.webidl");
  assert.notEqual(formatted, idl);
  assert.equal(
    formatted,
    `[Exposed=Window]
interface Foo {
  attribute boolean bar;
};`,
  );
  assert.doesNotThrow(() => {
    parse(formatted, "test.webidl");
  });
});

Deno.test("webidl_service formatting is deterministic", () => {
  const messy =
    `[Exposed=(Window,Worker)] interface Foo:Bar{readonly attribute DOMString name;undefined doThing(optional long x,DOMString... y);};`;
  const formatted = format(messy, "test.webidl");
  assert.equal(format(formatted, "test.webidl"), formatted);
  assert.equal(
    formatted,
    `[Exposed=(Window, Worker)]
interface Foo : Bar {
  readonly attribute DOMString name;
  undefined doThing(optional long x, DOMString... y);
};`,
  );
});

Deno.test("webidl_service formats enums and dictionary defaults as parseable IDL", () => {
  const idl =
    `enum E{"a","b"}; dictionary D{DOMString s="x"; boolean b=false; object? o=null; sequence<long> xs=[];};`;
  const formatted = format(idl, "test.webidl");
  assert.doesNotThrow(() => {
    parse(formatted, "test.webidl");
  });
  assert.ok(formatted.includes(`  "a",`));
  assert.ok(formatted.includes(`  DOMString s = "x";`));
});

Deno.test("webidl_service preserves final newline when formatting", () => {
  const idl = "interface Foo{attribute boolean bar;};\n";
  const formatted = format(idl, "test.webidl");
  assert.ok(formatted.endsWith("\n"));
  assert.equal(format(idl.trimEnd(), "test.webidl").endsWith("\n"), false);
});

Deno.test("webidl_service preserves leading comments while formatting", () => {
  const idl = `// Interface docs
interface Foo{
// Member docs
attribute boolean bar;
// End docs
};`;
  const formatted = format(idl, "test.webidl");
  assert.equal(
    formatted,
    `// Interface docs
[Exposed=Window]
interface Foo {
  // Member docs
  attribute boolean bar;
  // End docs
};`,
  );
});

Deno.test("webidl_service validates semantic errors in attributes", () => {
  const idl = `interface Test {
      attribute sequence<long> data;
    };`;
  const results = validateIDL(idl, "test.webidl");
  assert.ok(results.length > 0);
  assert.ok(results.some((r) => /sequence/.test(r.message)));
});

Deno.test("webidl_service enriches validation tokens with source ranges", () => {
  const idl = `[Exposed=Window]
interface Test {
  attribute sequence<long> data;
};`;
  const results = validateIDL(idl, "test.webidl");
  const result = results.find((r) => r.ruleName === "attr-invalid-type");
  assert.ok(result);

  const enriched = result as typeof result & {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  assert.equal(enriched.start.line, 2);
  assert.equal(enriched.start.column, 27);
  assert.equal(enriched.end.line, 2);
  assert.equal(enriched.end.column, 31);

  const token = result.tokens[0] as typeof result.tokens[0] & {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  assert.equal(token.value, "data");
  assert.deepEqual(token.start, enriched.start);
  assert.deepEqual(token.end, enriched.end);
});

Deno.test("webidl_service throws on syntax errors", () => {
  const idl = "callback Bad = undefined;";
  assert.throws(() => {
    parse(idl, "bad.webidl");
  });
});
