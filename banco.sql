-- Tabela de favoritos do "Nomes do Brasil"
-- Rode no Supabase em: SQL Editor -> New query -> cole tudo -> Run

create table favoritos (
  id          bigint generated always as identity primary key,
  criado_em   timestamptz not null default now(),
  nome_item   text not null unique
              check (nome_item ~ '^[A-Za-zÀ-ÿ]+$' and char_length(nome_item) <= 40),
  dados_extra text check (char_length(dados_extra) <= 200)
);

-- Liga a segurança por linha (RLS) e libera leitura, criação e exclusão para o público (anon).
-- Limitação conhecida: como não há login, qualquer visitante pode ver, criar e excluir favoritos.
alter table favoritos enable row level security;

create policy "anon pode ler"    on favoritos for select to anon using (true);
create policy "anon pode criar"  on favoritos for insert to anon with check (true);
create policy "anon pode excluir" on favoritos for delete to anon using (true);
