ci-build:
    @echo $$DOCKER_PASSWORD | docker login -u $$DOCKER_USERNAME --password-stdin
	@docker build -t transfer-telegram-bot --target prod .
	@docker tag transfer-telegram-bot $$DOCKER_USERNAME/transfer-telegram-bot:prod
	@docker push $$DOCKER_USERNAME/transfer-telegram-bot:prod

