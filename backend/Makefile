DB ?= $(or $(TICKETING_DB),data/ticketing.db)

.PHONY: seed clear-reservation list

seed:
	uv run python -m app.seed

clear-reservation:
	sqlite3 "$(DB)" "DELETE FROM reservations;"

list:
	@ls -l "$(DB)"
	@for t in $$(sqlite3 "$(DB)" "select name from sqlite_master where type='table' and name not like 'sqlite_%'"); do \
		echo "=== $$t ($$(sqlite3 "$(DB)" "select count(*) from $$t") rows)"; \
		sqlite3 -header -column "$(DB)" "select * from $$t limit 50"; \
	done
