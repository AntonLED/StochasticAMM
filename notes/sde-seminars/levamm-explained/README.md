# Шаблон презентации Beamer

Каркас презентации Beamer в формате 16:9 со стандартной темой Madrid.
Слайды, тема, заголовок и автор задаются в `main.tex`.
Примеры показывают оглавление, списки с пошаговым появлением, три типа
блоков, формулу, колонки с графиком TikZ и таблицу.

## Сборка

Нужны `latexmk` и XeLaTeX с пакетами Beamer, PGF/TikZ, `fontspec`,
русской локалью Babel и шрифтами CM Unicode. Из этой папки выполните

```sh
latexmk -xelatex -interaction=nonstopmode -halt-on-error -outdir=build main.tex
```

Результат сборки — `build/main.pdf`. В Overleaf выберите компилятор XeLaTeX
и укажите `main.tex` как главный файл.

## Материалы по LeVAMM

https://www.perplexity.ai/session/84794afc-a6cb-4542-bf89-7ce3b698f488 -- разбор
math primer от perplexity.
