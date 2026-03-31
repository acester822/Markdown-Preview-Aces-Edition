# Active / In Queue
## Add Edit in VS Code to Radial Menu
## Fix Preview editing behavior, add setting that can be enabled via settings to automatically switch the preview to the right pane when you select `Edit in VS Code`
## Go through right click context menu to see what all works and what is broken or not needed
## Check on why preview.css is minified as source, most likely a merge issue
## Update all dependencies and further harden extension
## Dynamic color changing based off of user selected theme or palette selection
## Potentially a WYSIWYG in line editing capabilites to the preview itself, so no secondary pane would be needed at all

# Complete
## Fix text color and text shadows - 03.31.26 
> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css
```css
code[class*=language-], pre[class*=language-]
 {
    color: #aeaeae;
    text-shadow: none;
}
```
## Fix Line Number alignment issues and recolor - 03.31.26
> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css
```css
.markdown-preview pre.line-numbers .line-numbers-rows > span::before {
    color: rgb(228, 213, 0) !important;
    text-align: center;
    width: 3em !important;
}

.markdown-preview pre.line-numbers .line-numbers-rows {
    border-right: 1px solid rgb(255, 238, 0) !important;
}
```
## Fix ugly grey divider - 03.31.26
> [!Note]
> This should go in the main theme, not the selectable ones, ie aces_codepunk.css
```css
html body hr
 {
    height: 4px;
    margin: 32px 0;
    background: linear-gradient(90deg, transparent, #f5a14c, #ffb366, #f5a14c, transparent);
    border: 0 none;
}
```
