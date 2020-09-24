# Plugin Changelogs

These changelogs must comply to a format that the changelog parser can read.

The parser is very dumb, so as to avoid lots of code for a feature that is
used very sparcely compared to the rest of plugin code.

The format must be as follows:

# Format

## Filename
The filename should be whatever is returned from getName converted to kebab-case

## Versions

Should begin with `# <version>`

Any markdown

Can have subsections
```md
## added
## fixed
## improved
## progress
```

H1/2 headings are not allowed inside changelog subsections.
