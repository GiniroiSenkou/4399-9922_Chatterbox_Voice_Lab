.PHONY: build up down dev logs shell-backend shell-frontend clean db-migrate download-models

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

gpu:
	docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh

clean:
	docker compose down -v --rmi local

db-migrate:
	docker compose exec backend alembic upgrade head

download-models:
	docker compose exec backend python -c "from scripts.download_models import download_all; download_all()"

restart:
	docker compose restart

restart-backend:
	docker compose restart backend
