## XeLaTeX build

dependencies:

- `latexmk`;
- XeLaTeX with Beamer, PGF/TikZ, `fontspec`;

```sh
latexmk -xelatex -interaction=nonstopmode -halt-on-error -outdir=build main.tex
```
