# Active / In Queue

## Add popular md function's as inserts from the context menu, for example `insert callout` > then you hit the arrow for that and a submenu of accepted callout types appears > click that and it automatically inserts the element where the cursor is at 

## All Codeblock font's across all themes should be Victor Mono Nerd Font to capture terminal special symbols and ligeratures properly, this may need to be a locally sourced font like it is for the Code-Server instance

## Fix Preview editing behavior, add setting that can be enabled via settings to automatically switch the preview to the right pane when you select `Edit in VS Code`

## Go through right click context menu to see what all works and what is broken or not needed

## Update all dependencies and further harden extension 2

## Make the radial action menu change appearance with the theme, aka match the theme, aka the radial action menu, footer, and floating icon dock in the topbar

## Dynamic color changing based off of user selected theme or palette selection

## Add smart sizing to borders of callouts, so it will fit the content instead of the entire row

# Complete

## Potentially a WYSIWYG in line editing capabilites to the preview itself, so no secondary pane would be needed at all
> [!Note]
> Partially implemented, WIP

## Codeblock css for the none theme needs its codeblock optimized to better match the main theme

## Add Edit in VS Code to Radial Menu - 04.01.26

## Add the ability to collapse sections via headers

> Implemented 04.01.26 — heading toggle buttons (▼/▶) injected into each h1–h6, section bodies wrapped in `div.md-section-body`, per-section localStorage persistence, and a collapse-all/expand-all button in the topbar.


## Reduce the amount of files in this repo, eliminate unused files, merge similar js scripts, etc

## Fix text color and text shadows - 03.31.26

> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css

```css
code[class*='language-'],
pre[class*='language-'] {
  color: #aeaeae;
  text-shadow: none;
}
```

## Fix Line Number alignment issues and recolor - 03.31.26

> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css

```css
.random-thing .random-thing-rows > span::before {
  text-align: center;
  width: 3em !important;
}
```
```css line-numbers
.random-thing .random-thing-rows > span::before {
  text-align: center;
  width: 3em !important;
}
```

## Fix ugly grey divider - 03.31.26

> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css

```css
html body hr {
  height: 4px;
  margin: 32px 0;
  background: linear-gradient(
    90deg,
    transparent,
    #f5a14c,
    #ffb366,
    #f5a14c,
    transparent
  );
  border: 0 none;
}
```
