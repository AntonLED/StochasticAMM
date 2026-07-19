// Команды, чей аргумент — обычный текст: пробелы внутри значимы.
const VERBATIM_ARG =
    /^\\(?:text[a-z]*|mbox|hbox|operatorname\*?|verb)\s*(?=\{)/;

// Без хотя бы одного из этих символов span почти наверняка не формула, а проза,
// которую remark-math разобрал ошибочно (классика — "$5 and $10").
const LOOKS_LIKE_LATEX = /[\\{}^_]/;

const INDENT = "  ";

function readBalancedBraces(source, start) {
    let depth = 0;
    for (let i = start; i < source.length; i++) {
        const char = source[i];
        if (char === "\\") {
            i++;
            continue;
        }
        if (char === "{") depth++;
        else if (char === "}" && --depth === 0) return i + 1;
    }
    return source.length;
}

// Схлопывает пробельные пробеги до одного пробела. Полностью убирать нельзя:
// пробел отделяет управляющую последовательность от следующей буквы.
function collapseSpaces(source) {
    let out = "";
    let i = 0;
    while (i < source.length) {
        const rest = source.slice(i);

        const verbatim = rest.match(VERBATIM_ARG);
        if (verbatim) {
            const argEnd = readBalancedBraces(source, i + verbatim[0].length);
            out += source.slice(i, argEnd);
            i = argEnd;
            continue;
        }

        if (source[i] === "\\") {
            out += source.slice(i, i + 2);
            i += 2;
            continue;
        }

        if (source[i] === " " || source[i] === "\t") {
            out += " ";
            while (
                i < source.length &&
                (source[i] === " " || source[i] === "\t")
            )
                i++;
            continue;
        }

        out += source[i];
        i++;
    }
    return out;
}

// raw — исходный срез вместе с разделителями, например "$ a_1 $".
export function normalizeInline(raw) {
    const match = raw.match(/^(\$+)([\s\S]*)\1$/);
    if (!match) return raw;

    const [, delimiter, body] = match;
    if (!LOOKS_LIKE_LATEX.test(body)) return raw;

    return delimiter + collapseSpaces(body).trim() + delimiter;
}

// value — содержимое display-формулы без обрамляющих "$$" и без отступа строки.
export function normalizeBlock(value) {
    const lines = value.split("\n").map((line) => collapseSpaces(line).trim());

    let depth = 0;
    const indented = lines.map((line) => {
        const opened = line.match(/\\begin\{/g)?.length ?? 0;
        const closed = line.match(/\\end\{/g)?.length ?? 0;
        // Строка, открывающаяся \end, выравнивается по своему \begin, а не по телу.
        const level = line.startsWith("\\end{")
            ? Math.max(0, depth - 1)
            : depth;
        depth = Math.max(0, depth + opened - closed);
        return line === "" ? "" : INDENT.repeat(level) + line;
    });

    while (indented.length && indented[0] === "") indented.shift();
    while (indented.length && indented.at(-1) === "") indented.pop();
    return indented.join("\n");
}
