import assert from "node:assert/strict";
import { test } from "node:test";
import * as prettier from "prettier";

import plugin from "./index.mjs";

const format = (source) =>
    prettier.format(source, {
        parser: "markdown",
        plugins: [plugin],
        proseWrap: "always",
        printWidth: 80,
    });

test("подчёркивание в инлайн-формуле не превращается в звёздочку", async () => {
    const source =
        "for $ G(\\tau) \\equiv \\lim_{T \\to \\infty} \\int_{0}^{T} dt$ we write\n";
    const out = await format(source);
    assert.match(out, /\\lim_\{T \\to \\infty\}/);
    assert.match(out, /\\int_\{0\}\^\{T\}/);
    assert.doesNotMatch(out, /\\lim\*/);
});

test("пробелы у границ формулы обрезаются", async () => {
    const out = await format("text $ a_1 + b_2 $ tail\n");
    assert.equal(out, "text $a_1 + b_2$ tail\n");
});

test("markdown вокруг формулы всё ещё форматируется", async () => {
    const out = await format("*emph*   and   $a_1$\n");
    assert.equal(out, "_emph_ and $a_1$\n");
});

test("доллар внутри инлайн-кода не считается формулой", async () => {
    const out = await format("text `$notmath$` tail\n");
    assert.equal(out, "text `$notmath$` tail\n");
});

test("доллар внутри fenced-блока не считается формулой", async () => {
    const source = "```\n$not_math$\n```\n";
    const out = await format(source);
    assert.equal(out, source);
});

test("экранированный доллар не считается формулой", async () => {
    const out = await format("costs \\$5 and \\$10 total\n");
    assert.equal(out, "costs \\$5 and \\$10 total\n");
});

test("валюта переживает round-trip без изменений", async () => {
    const out = await format("costs $5 and $10 total\n");
    assert.equal(out, "costs $5 and $10 total\n");
});

test("несколько формул в одном абзаце", async () => {
    const out = await format("$a_1$ and $b_2$ and $c_3$\n");
    assert.equal(out, "$a_1$ and $b_2$ and $c_3$\n");
});

test("формула не рвётся переносом строки", async () => {
    const source =
        "word word word word word word $\\alpha_1 + \\beta_2 + \\gamma_3 + \\delta_4$ word\n";
    const out = await format(source);
    const mathLine = out.split("\n").find((line) => line.includes("\\alpha_1"));
    assert.match(
        mathLine,
        /\$\\alpha_1 \+ \\beta_2 \+ \\gamma_3 \+ \\delta_4\$/,
    );
});

test("display-формула печатается на своих строках", async () => {
    const out = await format("before\n\n$$\na_1 = b_2\n$$\n\nafter\n");
    assert.equal(out, "before\n\n$$\na_1 = b_2\n$$\n\nafter\n");
});

test("display-формула внутри списка: отступ списка + отступ окружения", async () => {
    const source =
        "- item\n\n  $$\n  \\begin{align}\n  a_1 &= b_2\n  \\end{align}\n  $$\n";
    const expected =
        "- item\n\n  $$\n  \\begin{align}\n    a_1 &= b_2\n  \\end{align}\n  $$\n";
    assert.equal(await format(source), expected);
    assert.equal(await format(expected), expected);
});

test("нумерация списка не ломается", async () => {
    const source = "1. first $x_1$\n2. second $y_2$\n";
    assert.equal(await format(source), source);
});

test("форматирование идемпотентно", async () => {
    const source =
        "- non-ergodic. btw for $ G(\\tau) \\equiv \\lim_{T \\to \\infty} \\int_{0}^{T} dt \\, x(t) $ we may write $G = \\left< x \\right>$ only under ergodicity (_assemble average_)\n";
    const once = await format(source);
    const twice = await format(once);
    assert.equal(twice, once);
});

test("текст без формул не затрагивается плагином", async () => {
    const out = await format("plain *text* with _emphasis_\n");
    assert.equal(out, "plain _text_ with _emphasis_\n");
});
