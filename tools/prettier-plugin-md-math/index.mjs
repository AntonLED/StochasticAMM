import { doc } from "prettier";
import markdown from "prettier/plugins/markdown";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { normalizeBlock, normalizeInline } from "./normalize.mjs";

const { hardline, join } = doc.builders;

const baseParser = markdown.parsers.markdown;
const basePrinter = markdown.printers.mdast;

const INLINE = "MPHI:";
const BLOCK = "MPHB:";

const processor = unified().use(remarkParse).use(remarkMath);

const encode = (text) => Buffer.from(text, "utf8").toString("base64");
const decode = (text) => Buffer.from(text, "base64").toString("utf8");

function collectMath(node, found = []) {
    if (node.type === "inlineMath" || node.type === "math") found.push(node);
    for (const child of node.children ?? []) collectMath(child, found);
    return found;
}

// Прячем каждую формулу за однострочный inlineCode-плейсхолдер: markdown-парсер
// prettier видит код, а не emphasis, и не трогает `_`. Плейсхолдер обязан быть
// однострочным — многострочный сбил бы отступ внутри элемента списка.
function preprocess(text) {
    let found;
    try {
        found = collectMath(processor.parse(text));
    } catch {
        return text;
    }
    if (found.length === 0) return text;

    let result = text;
    for (const node of found.reverse()) {
        const { start, end } = node.position;
        // Инлайн нормализуем из исходного среза: он содержит разделители `$`.
        // У блочной формулы срез содержит отступ строки — берём value.
        const payload =
            node.type === "inlineMath"
                ? INLINE +
                  encode(normalizeInline(text.slice(start.offset, end.offset)))
                : BLOCK + encode(normalizeBlock(node.value));
        result =
            result.slice(0, start.offset) +
            "`" +
            payload +
            "`" +
            result.slice(end.offset);
    }
    return result;
}

function printPlaceholder(value) {
    if (value.startsWith(INLINE)) return decode(value.slice(INLINE.length));
    const body = decode(value.slice(BLOCK.length));
    return join(hardline, ["$$", ...body.split("\n"), "$$"]);
}

const plugin = {
    parsers: {
        markdown: { ...baseParser, preprocess },
    },
    printers: {
        mdast: {
            ...basePrinter,
            print(path, options, print, args) {
                const node = path.node ?? path.getValue();
                if (
                    node.type === "inlineCode" &&
                    (node.value.startsWith(INLINE) ||
                        node.value.startsWith(BLOCK))
                ) {
                    return printPlaceholder(node.value);
                }
                return basePrinter.print(path, options, print, args);
            },
        },
    },
};

export default plugin;
export const { parsers, printers } = plugin;
