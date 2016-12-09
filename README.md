#HyphenJs

HyphenJs, an Angular module made to simplify data model creation for Angular app.

###Installation
If you'd like to use npm, it's as easy as:
```html
npm install hyphen-js --save
```

```html
bower install hyphen-js --save
```

or download source code with minified version from git hub:
[source code] (https://github.com/blazejgrzelinski/hyphen-js)

Add HyphenJs script to your html file, usaually it should looks like below (when installed with npm)

```html
<script src="node_modules/hyphen-js/dist/hyphen-js.js"></script>
```

### Prerequisites
Hyphen JS require Angular and Underscore.


###Configuration and setup

####Add HyphenJs to your Angular app as dependency
```javascript
var exampleApp = angular.module('exampleApp', ['jsHyphen']);
```
