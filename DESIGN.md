# Product design

Relay deliberately optimizes one workflow: create a bot, add knowledge, verify grounded answers, and publish. The interface uses the `core-` feature modules and keeps source status, fallback behavior, citations, and deployment controls visible.

Answers display numbered evidence cards. Cards contain a supporting excerpt and link to the original page when the source is a website. Weak semantic retrieval returns the bot's configured fallback instead of passing unrelated context to the model.

See the root [README](../README.md) for the current product scope and [LEGACY.md](../LEGACY.md) for inactive experiments.
