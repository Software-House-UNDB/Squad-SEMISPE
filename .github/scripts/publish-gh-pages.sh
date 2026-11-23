#!/usr/bin/env bash
# Grava arquivos na branch gh-pages (servida pelo GitHub Pages) a partir do
# workspace do Actions. Usado por deploy-pages.yml e update-stations.yml.
#
# Uso:
#   publish-gh-pages.sh site <pasta-do-build> <mensagem>
#       Troca todo o conteudo da gh-pages pelo build (apaga restos antigos),
#       mantendo o stations.json que ja estiver la.
#   publish-gh-pages.sh file <arquivo> <mensagem>
#       Atualiza so esse arquivo na raiz da gh-pages.
#
# Os dois workflows publicam na mesma branch e podem coincidir: se o push for
# rejeitado porque a gh-pages andou, refaz tudo a partir da ponta nova.
set -euo pipefail

mode="${1:?modo: site ou file}"
source_path="$(realpath "${2:?pasta ou arquivo de origem}")"
message="${3:?mensagem do commit}"

case "$mode" in
  site | file) ;;
  *)
    echo "::error::Modo invalido: $mode (use site ou file)"
    exit 1
    ;;
esac

if ! git ls-remote --exit-code --heads origin gh-pages > /dev/null; then
  echo "::error::A branch gh-pages nao existe no remoto. Crie-a antes de publicar."
  exit 1
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# Subshell com seu proprio "set -e" (ele nao vale dentro de um "if").
attempt() (
  set -euo pipefail
  git fetch origin gh-pages
  site="${RUNNER_TEMP:-$(mktemp -d)}/site"
  git worktree remove --force "$site" 2> /dev/null || true
  rm -rf "$site"
  git worktree prune
  git worktree add -B gh-pages "$site" FETCH_HEAD
  cd "$site"

  if [ "$mode" = site ]; then
    kept=""
    if [ -f stations.json ]; then
      kept="$(mktemp)"
      cp stations.json "$kept"
    fi
    git rm -rq --ignore-unmatch .
    cp -R "$source_path/." .
    if [ -n "$kept" ]; then cp "$kept" stations.json; fi
    # Sem Jekyll: ele ignora pastas iniciadas por "_"
    touch .nojekyll
  else
    cp "$source_path" "./$(basename "$source_path")"
  fi

  git add -A
  if git diff --cached --quiet; then
    echo "Nenhuma mudanca para publicar."
    exit 0
  fi
  git commit -q -m "$message"
  git push origin HEAD:gh-pages
)

for n in 1 2 3; do
  set +e
  attempt
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then exit 0; fi
  echo "::warning::Tentativa $n de 3 falhou (codigo $status)."
  sleep $((n * 5))
done

echo "::error::Nao foi possivel publicar na gh-pages."
exit 1
