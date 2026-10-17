# Nomes do Brasil

## Autor
Mateus Itibal – Matrícula 22502039

## Descrição
Aplicação web que mostra a popularidade de um nome no Brasil: quantas pessoas o têm, em que década ele foi mais usado, a divisão entre feminino e masculino e os estados onde é mais comum. Útil para curiosos, futuros pais escolhendo nome para o bebê e para quem gosta de dados sobre o Brasil.

## API utilizada
- **API de Nomes do IBGE** (Censo 2010) — documentação: https://servicodados.ibge.gov.br/api/docs/nomes
- Endpoints consumidos:
  - `GET https://servicodados.ibge.gov.br/api/v2/censos/nomes/{nome}` — frequência por década
  - `GET https://servicodados.ibge.gov.br/api/v2/censos/nomes/{nome}?sexo=F` e `?sexo=M` — frequência por sexo
  - `GET https://servicodados.ibge.gov.br/api/v2/censos/nomes/{nome}?groupBy=UF` — proporção por estado

## Funcionalidades
- Buscar qualquer primeiro nome pelo campo de busca (botão ou tecla Enter)
- Testar nomes de exemplo com um clique
- Ver o total de pessoas com o nome no Brasil
- Ver a década de maior popularidade e o número de nascimentos nela
- Ver um gráfico de nascimentos por década
- Ver a proporção entre feminino e masculino
- Ver os 5 estados onde o nome é mais comum (proporção a cada 100 mil habitantes)
- Mensagens amigáveis para nome não encontrado, entrada inválida ou API fora do ar

## Como executar localmente
1. Clone: `git clone https://github.com/mateusitibal-byte/DesafioBootcamp2``
2. Abra o arquivo `index.html` no navegador

## Links
- **Aplicação no ar (GitHub Pages):** https://mateusitibal-byte.github.io/DesafioBootcamp2/
- **Repositório:** https://github.com/mateusitibal-byte/DesafioBootcamp2
