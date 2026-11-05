# Secret detection assets

Both gzip files are copied unchanged from Betterleaks commit
`6cd808f299a81b19fdbd196b04a64e63565c8c5c`.

- `cl100k_base.tiktoken.gz`: Betterleaks tokenizer merge ranks. SHA-256:
  `4414e3fb432aa5c4a9a19d5b91fe5ab27fecb8f5347208696a01bc507e093696`.
  The upstream tokenizer identifies these as `cl100k_base` ranks. See the
  Betterleaks and OpenAI tiktoken MIT notices in this directory.
- `words.txt.gz`: Betterleaks word list. SHA-256:
  `d4dd5530d98f4ff343864ed71cfc0064abeae34e4f078edc0b46590c2da8fb47`.
  Betterleaks identifies this as an NLTK word list. The NLTK data catalog
  identifies its `words` corpus as public domain:
  https://github.com/nltk/nltk_data/blob/gh-pages/packages/corpora/words.xml.
  The exact derivation of Betterleaks' compressed list has not been independently
  verified; preserve the Betterleaks notice with this asset.

Betterleaks source: https://github.com/betterleaks/betterleaks

OpenAI tiktoken: https://github.com/openai/tiktoken
