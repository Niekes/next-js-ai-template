# Shortcuts for the pnpm scripts and Docker. Every target is a thin wrapper:
# the real commands live in package.json and docker-compose.yml.
.DEFAULT_GOAL := help
.PHONY: help setup start stop db-migrate db-generate db-studio db-reset test lint verify build

help: ## List the targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-12s %s\n", $$1, $$2}'

setup: ## First run: install, create .env with a secret, start Postgres, migrate
	pnpm install
	@test -f .env || { secret=$$(openssl rand -base64 32) && [ -n "$$secret" ] \
		&& sed "s|^BETTER_AUTH_SECRET=$$|BETTER_AUTH_SECRET=$$secret|" .env.example > .env.tmp \
		&& mv .env.tmp .env; }
	docker compose up -d --wait
	pnpm db:migrate

start: ## Start Postgres, migrate, run the dev server (Ctrl+C stops it)
	docker compose up -d --wait
	pnpm db:migrate
	pnpm dev

stop: ## Stop Postgres (data is kept)
	docker compose down

db-migrate: ## Apply migrations
	pnpm db:migrate

db-generate: ## Generate a migration from the schema
	pnpm db:generate

db-studio: ## Open Drizzle Studio
	pnpm db:studio

db-reset: ## Delete all local data (asks first)
	@printf "Delete all local database data? [y/N] "; read answer; case "$$answer" in [yY]) ;; *) exit 1 ;; esac
	docker compose down -v

test: ## Run the tests
	pnpm test

lint: ## Lint and format, fixing what can be fixed
	pnpm lint --fix

verify: ## Run the full gate (same as CI)
	pnpm verify

build: ## Production build
	pnpm build
