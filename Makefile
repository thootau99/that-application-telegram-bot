docker-login:
	@docker login -u $$DOCKER_USERNAME -p $$DOCKER_PASSWORD

ci-build: docker-login
	@docker build -t transfer-telegram-bot --target prod .
	@docker tag transfer-telegram-bot $$DOCKER_USERNAME/transfer-telegram-bot:prod
	@docker push $$DOCKER_USERNAME/transfer-telegram-bot:prod

ci-deploy:
	@ssh production "mkdir -p /home/$$SSH_USER/transfer-telegram-bot"
	@ssh production "cd /home/$$SSH_USER/transfer-telegram-bot && docker-compose pull && docker-compose up -d"


