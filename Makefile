docker-login:
	@docker login -u $$DOCKER_USERNAME -p $$DOCKER_PASSWORD

ci-build: docker-login
	@docker build -t transfer-telegram-bot --target prod .
	@docker tag transfer-telegram-bot $$DOCKER_USERNAME/transfer-telegram-bot:prod
	@docker push $$DOCKER_USERNAME/transfer-telegram-bot:prod


