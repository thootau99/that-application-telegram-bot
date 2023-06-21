docker-login:
	@docker login -u $$DOCKER_USERNAME -p $$DOCKER_PASSWORD

ci-build: docker-login
	@docker build -t transfer-telegram-bot --target prod .
	@docker tag transfer-telegram-bot $$DOCKER_USERNAME/transfer-telegram-bot:prod
	@docker push $$DOCKER_USERNAME/transfer-telegram-bot:prod

add-ssh-key:
	@eval $(ssh-agent -s)
	@echo "$$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -

ci-deploy: add-ssh-key
	@ssh -oStrictHostKeyChecking=no $$SSH_USER@$SSH_HOST "mkdir -p /home/$$SSH_USER/transfer-telegram-bot"
	@ssh -oStrictHostKeyChecking=no $$SSH_USER@$SSH_HOST "cd /home/$$SSH_USER/transfer-telegram-bot && docker-compose pull && docker-compose up -d"


