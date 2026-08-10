index.html: README.md snip.lua
	pandoc -s --lua-filter snip.lua -M title=snip \
	  -V header-includes='<script type="module" src="./snip.js"></script>' \
	  README.md -o index.html

clean:
	rm -f index.html

.PHONY: clean
