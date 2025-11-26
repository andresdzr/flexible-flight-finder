VENV_DIR = .venv

.PHONY: all setup clean

all: setup

setup: $(VENV_DIR)/bin/activate
	$(VENV_DIR)/bin/pip install -r requirements.txt

$(VENV_DIR)/bin/activate:
	python3 -m venv $(VENV_DIR)

clean:
	rm -rf $(VENV_DIR)