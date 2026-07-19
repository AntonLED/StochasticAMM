import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeBlock, normalizeInline } from "./normalize.mjs";

test("обрезает пробелы у границ $", () => {
    assert.equal(normalizeInline("$ G(\\tau) $"), "$G(\\tau)$");
});

test("схлопывает кратные пробелы", () => {
    assert.equal(
        normalizeInline("$\\lim_{T  \\to   \\infty}$"),
        "$\\lim_{T \\to \\infty}$",
    );
});

test("не склеивает управляющую последовательность с буквой", () => {
    // \alpha beta != \alphabeta: последний пробел несёт смысл
    assert.equal(normalizeInline("$\\alpha  beta$"), "$\\alpha beta$");
});

test("не трогает пробелы внутри \\text{...}", () => {
    assert.equal(
        normalizeInline("$x = \\text{a  b   c} + y$"),
        "$x = \\text{a  b   c} + y$",
    );
});

test("не трогает вложенные фигурные скобки внутри \\text{...}", () => {
    assert.equal(
        normalizeInline("$\\text{a {b  c}  d}  + z$"),
        "$\\text{a {b  c}  d} + z$",
    );
});

test("валюта без признаков LaTeX остаётся нетронутой", () => {
    // remark-math ошибочно видит здесь формулу; trim дал бы "$5 and$10"
    assert.equal(normalizeInline("$5 and $"), "$5 and $");
});

test("формула с подчёркиванием нормализуется", () => {
    assert.equal(normalizeInline("$ a_1 + b_2 $"), "$a_1 + b_2$");
});

test("двойные доллары как инлайн сохраняют разделитель", () => {
    assert.equal(normalizeInline("$$ a_1 $$"), "$$a_1$$");
});

test("экранированный бэкслеш не считается началом команды", () => {
    assert.equal(normalizeInline("$a \\\\  b_1$"), "$a \\\\ b_1$");
});

test("блок: отступы внутри окружения", () => {
    assert.equal(
        normalizeBlock("\\begin{align}\na &= b\n\\end{align}"),
        "\\begin{align}\n  a &= b\n\\end{align}",
    );
});

test("блок: вложенные окружения", () => {
    assert.equal(
        normalizeBlock(
            "\\begin{align}\nx &= \\begin{cases}\n1\n\\end{cases}\n\\end{align}",
        ),
        "\\begin{align}\n  x &= \\begin{cases}\n    1\n  \\end{cases}\n\\end{align}",
    );
});

test("блок: существующие отступы переустанавливаются", () => {
    assert.equal(
        normalizeBlock("\\begin{align}\n        a &= b\n\\end{align}"),
        "\\begin{align}\n  a &= b\n\\end{align}",
    );
});

test("блок без окружения не получает отступа", () => {
    assert.equal(normalizeBlock("a_1  =  b_2"), "a_1 = b_2");
});

test("блок: пустые строки остаются пустыми, без хвостовых пробелов", () => {
    assert.equal(
        normalizeBlock("\\alpha_1\n\n\\beta_2  "),
        "\\alpha_1\n\n\\beta_2",
    );
});

test("нормализация идемпотентна", () => {
    const once = normalizeBlock(
        "\\begin{align}\na  &=  b \\\\\nc &= d\n\\end{align}",
    );
    assert.equal(normalizeBlock(once), once);
    const inline = normalizeInline("$  \\int_{0}^{T}  dt  $");
    assert.equal(normalizeInline(inline), inline);
});
