/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SchemaExplorer = void 0;
const vscode = __webpack_require__(2);
const SchemaModel_1 = __webpack_require__(3);
const fileUtils_1 = __webpack_require__(4);
const SchemaTreeDataProvider_1 = __webpack_require__(7);
class SchemaExplorer {
    constructor(context) {
        this.schemaModel = new SchemaModel_1.default(() => this.reveal());
        const treeDataProvider = new SchemaTreeDataProvider_1.default(this.schemaModel);
        this.schemaViewer = vscode.window.createTreeView("RailsSchema", {
            treeDataProvider,
        });
        let watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders?.[0].uri.path || "", "**/schema.rb"));
        watcher.onDidChange(() => {
            treeDataProvider.refresh();
        });
        let disposable = vscode.commands.registerCommand("rails-schema.showRailsSchema", () => this.reveal());
        context.subscriptions.push(vscode.commands.registerCommand("rails-schema.openInSchema", (node) => {
            const uri = (0, fileUtils_1.getSchemaUri)();
            if (uri === undefined) {
                return;
            }
            vscode.workspace
                .openTextDocument(uri)
                .then((document) => {
                this.openInSchema(document, node);
            });
        }));
        context.subscriptions.push(disposable);
    }
    async openInSchema(document, node) {
        const lineCount = document.lineCount;
        let tableLine = 0;
        for (let index = 0; index < lineCount; index++) {
            const schemaTextLine = document.lineAt(index);
            if (schemaTextLine.text
                .trimLeft()
                .startsWith(`create_table "${node.label}"`)) {
                tableLine = index;
            }
        }
        const editor = await vscode.window.showTextDocument(document.uri);
        const position = new vscode.Position(tableLine, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
    }
    reveal() {
        const currentTable = (0, fileUtils_1.getCurrentTableName)();
        let node = this.getNode(currentTable);
        if (node) {
            this.schemaViewer.reveal(node, {
                expand: true,
                select: true,
                focus: true,
            });
        }
        else {
            (0, fileUtils_1.lookForCustomTableName)((customTableName) => {
                node = this.getNode(customTableName);
                if (node) {
                    this.schemaViewer.reveal(node, {
                        expand: true,
                        select: true,
                        focus: true,
                    });
                }
                else {
                    const schemaNodes = this.schemaModel.data;
                    this.schemaViewer.reveal(schemaNodes[0], {
                        expand: false,
                        select: true,
                        focus: true,
                    });
                }
            });
        }
    }
    getNode(label) {
        const schemaNodes = this.schemaModel.data;
        if (schemaNodes.length === 0) {
            return undefined;
        }
        return schemaNodes.find((node) => {
            if (node.label === label) {
                return node;
            }
        });
    }
}
exports.SchemaExplorer = SchemaExplorer;


/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const vscode = __webpack_require__(2);
const fileUtils_1 = __webpack_require__(4);
class SchemaModel {
    constructor(callback) {
        this.data = [];
        this.callback = callback;
        this.getRailsSchema();
    }
    refreshSchema() {
        this.getRailsSchema();
    }
    getRailsSchema() {
        const uri = (0, fileUtils_1.getSchemaUri)();
        if (uri === undefined) {
            return;
        }
        vscode.workspace.openTextDocument(uri).then((document) => {
            const schemaText = document.getText();
            const tablesRegex = /create_table([\s\S]*?)(  end)/g;
            const tableNameRegex = /(?<=create_table ")([\s\S]*?)(?=("))/g;
            const tableDefinitionRegex = /(?=create_table )([\s\S]*?)(do)/g;
            const commentsInfoRegex = /(?=comment: )([\s\S]*?)(?=(" do)|(",))/;
            const tablesRegexMatch = schemaText.match(tablesRegex);
            if (tablesRegexMatch === null || tablesRegexMatch.length === 0) {
                return;
            }
            const schemaNodes = tablesRegexMatch.map((tableText) => {
                const tableLableMatch = tableText.match(tableNameRegex);
                const tableDefinitionMatch = tableText.match(tableDefinitionRegex);
                const commentsInfo = tableDefinitionMatch ? tableDefinitionMatch[0].match(commentsInfoRegex) : "";
                const children = this.getTableFields(tableText);
                const label = tableLableMatch ? tableLableMatch[0] : "";
                const tooltip = commentsInfo ? `${commentsInfo[0]}"` : "";
                return {
                    label: label,
                    tooltip: tooltip,
                    isTable: true,
                    children: children,
                    parent: undefined,
                };
            });
            this.data = schemaNodes;
            this.callback();
        }, (_err) => vscode.window.showInformationMessage("Cannot find db/schema.rb file in the workspace"));
    }
    getTableFields(tableText) {
        const fieldsRegex = /(?= t\.(?!index))([\s\S]*?)(?=\n)/g;
        const fieldLabelRegex = /(?<=")([\s\S]*?)(?=("))/g;
        const typeLabelRegex = /(?<=t\.)([\s\S]*?)(?=( ))/g;
        const extraInfoRegex = /(?<=,)([\s\S]*?)(?=(, comment))/g;
        const commentsInfoRegex = /(?=comment: )([\s\S]*?)*("|')/;
        const fields = tableText.match(fieldsRegex) || [];
        return fields.map((fieldText) => {
            const fieldMatch = fieldText.match(fieldLabelRegex);
            const typeMatch = fieldText.match(typeLabelRegex);
            const extraInfo = fieldText.match(extraInfoRegex);
            const commentsInfo = fieldText.match(commentsInfoRegex);
            const label = fieldMatch && typeMatch ? `${fieldMatch[0]}: ${typeMatch[0]}` : "";
            const description = extraInfo ? extraInfo[0] : "";
            const tooltip = commentsInfo ? commentsInfo[0] : "";
            return {
                label: label,
                description: description,
                tooltip: tooltip,
                isTable: false,
                children: [],
                parent: undefined,
            };
        });
    }
}
exports["default"] = SchemaModel;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lookForCustomTableName = exports.getCurrentTableName = exports.getSchemaUri = void 0;
const vscode = __webpack_require__(2);
const vscode_uri_1 = __webpack_require__(5);
function getSchemaUri() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined || workspaceFolders.length === 0) {
        return;
    }
    const workspacePath = workspaceFolders[0].uri.path;
    return vscode_uri_1.URI.file(workspacePath + "/db/schema.rb");
}
exports.getSchemaUri = getSchemaUri;
function getCurrentTableName() {
    const pluralize = __webpack_require__(6);
    const modelPathRegex = /(?<=models\/)([\s\S]*?)(?=(.rb))/g;
    const currentDocumentPath = vscode.window.activeTextEditor?.document?.fileName;
    const modelPathMatch = currentDocumentPath?.match(modelPathRegex);
    const modelPath = modelPathMatch ? modelPathMatch[0] : null;
    const modelName = modelPath?.replace("/", "_");
    return modelName ? pluralize(modelName) : null;
}
exports.getCurrentTableName = getCurrentTableName;
function lookForCustomTableName(callback) {
    const currentDocumentUri = vscode.window.activeTextEditor?.document?.uri;
    if (currentDocumentUri === undefined) {
        callback(null);
        return;
    }
    vscode.workspace.openTextDocument(currentDocumentUri).then((document) => {
        const documentText = document.getText();
        const customTableRegex = /(?<=self\.table_name =)([\s\S]*?)\n/g;
        const customTableMatch = documentText.match(customTableRegex);
        if (customTableMatch === null || customTableMatch.length === 0) {
            callback(null);
            return;
        }
        const customTableText = customTableMatch[0].trim().replace(/'|"/g, "");
        callback(customTableText);
    });
}
exports.lookForCustomTableName = lookForCustomTableName;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "URI": () => (/* binding */ URI),
/* harmony export */   "Utils": () => (/* binding */ Utils)
/* harmony export */ });
var LIB;LIB=(()=>{"use strict";var t={470:t=>{function e(t){if("string"!=typeof t)throw new TypeError("Path must be a string. Received "+JSON.stringify(t))}function r(t,e){for(var r,n="",o=0,i=-1,a=0,h=0;h<=t.length;++h){if(h<t.length)r=t.charCodeAt(h);else{if(47===r)break;r=47}if(47===r){if(i===h-1||1===a);else if(i!==h-1&&2===a){if(n.length<2||2!==o||46!==n.charCodeAt(n.length-1)||46!==n.charCodeAt(n.length-2))if(n.length>2){var s=n.lastIndexOf("/");if(s!==n.length-1){-1===s?(n="",o=0):o=(n=n.slice(0,s)).length-1-n.lastIndexOf("/"),i=h,a=0;continue}}else if(2===n.length||1===n.length){n="",o=0,i=h,a=0;continue}e&&(n.length>0?n+="/..":n="..",o=2)}else n.length>0?n+="/"+t.slice(i+1,h):n=t.slice(i+1,h),o=h-i-1;i=h,a=0}else 46===r&&-1!==a?++a:a=-1}return n}var n={resolve:function(){for(var t,n="",o=!1,i=arguments.length-1;i>=-1&&!o;i--){var a;i>=0?a=arguments[i]:(void 0===t&&(t=process.cwd()),a=t),e(a),0!==a.length&&(n=a+"/"+n,o=47===a.charCodeAt(0))}return n=r(n,!o),o?n.length>0?"/"+n:"/":n.length>0?n:"."},normalize:function(t){if(e(t),0===t.length)return".";var n=47===t.charCodeAt(0),o=47===t.charCodeAt(t.length-1);return 0!==(t=r(t,!n)).length||n||(t="."),t.length>0&&o&&(t+="/"),n?"/"+t:t},isAbsolute:function(t){return e(t),t.length>0&&47===t.charCodeAt(0)},join:function(){if(0===arguments.length)return".";for(var t,r=0;r<arguments.length;++r){var o=arguments[r];e(o),o.length>0&&(void 0===t?t=o:t+="/"+o)}return void 0===t?".":n.normalize(t)},relative:function(t,r){if(e(t),e(r),t===r)return"";if((t=n.resolve(t))===(r=n.resolve(r)))return"";for(var o=1;o<t.length&&47===t.charCodeAt(o);++o);for(var i=t.length,a=i-o,h=1;h<r.length&&47===r.charCodeAt(h);++h);for(var s=r.length-h,f=a<s?a:s,u=-1,c=0;c<=f;++c){if(c===f){if(s>f){if(47===r.charCodeAt(h+c))return r.slice(h+c+1);if(0===c)return r.slice(h+c)}else a>f&&(47===t.charCodeAt(o+c)?u=c:0===c&&(u=0));break}var l=t.charCodeAt(o+c);if(l!==r.charCodeAt(h+c))break;47===l&&(u=c)}var p="";for(c=o+u+1;c<=i;++c)c!==i&&47!==t.charCodeAt(c)||(0===p.length?p+="..":p+="/..");return p.length>0?p+r.slice(h+u):(h+=u,47===r.charCodeAt(h)&&++h,r.slice(h))},_makeLong:function(t){return t},dirname:function(t){if(e(t),0===t.length)return".";for(var r=t.charCodeAt(0),n=47===r,o=-1,i=!0,a=t.length-1;a>=1;--a)if(47===(r=t.charCodeAt(a))){if(!i){o=a;break}}else i=!1;return-1===o?n?"/":".":n&&1===o?"//":t.slice(0,o)},basename:function(t,r){if(void 0!==r&&"string"!=typeof r)throw new TypeError('"ext" argument must be a string');e(t);var n,o=0,i=-1,a=!0;if(void 0!==r&&r.length>0&&r.length<=t.length){if(r.length===t.length&&r===t)return"";var h=r.length-1,s=-1;for(n=t.length-1;n>=0;--n){var f=t.charCodeAt(n);if(47===f){if(!a){o=n+1;break}}else-1===s&&(a=!1,s=n+1),h>=0&&(f===r.charCodeAt(h)?-1==--h&&(i=n):(h=-1,i=s))}return o===i?i=s:-1===i&&(i=t.length),t.slice(o,i)}for(n=t.length-1;n>=0;--n)if(47===t.charCodeAt(n)){if(!a){o=n+1;break}}else-1===i&&(a=!1,i=n+1);return-1===i?"":t.slice(o,i)},extname:function(t){e(t);for(var r=-1,n=0,o=-1,i=!0,a=0,h=t.length-1;h>=0;--h){var s=t.charCodeAt(h);if(47!==s)-1===o&&(i=!1,o=h+1),46===s?-1===r?r=h:1!==a&&(a=1):-1!==r&&(a=-1);else if(!i){n=h+1;break}}return-1===r||-1===o||0===a||1===a&&r===o-1&&r===n+1?"":t.slice(r,o)},format:function(t){if(null===t||"object"!=typeof t)throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof t);return function(t,e){var r=e.dir||e.root,n=e.base||(e.name||"")+(e.ext||"");return r?r===e.root?r+n:r+"/"+n:n}(0,t)},parse:function(t){e(t);var r={root:"",dir:"",base:"",ext:"",name:""};if(0===t.length)return r;var n,o=t.charCodeAt(0),i=47===o;i?(r.root="/",n=1):n=0;for(var a=-1,h=0,s=-1,f=!0,u=t.length-1,c=0;u>=n;--u)if(47!==(o=t.charCodeAt(u)))-1===s&&(f=!1,s=u+1),46===o?-1===a?a=u:1!==c&&(c=1):-1!==a&&(c=-1);else if(!f){h=u+1;break}return-1===a||-1===s||0===c||1===c&&a===s-1&&a===h+1?-1!==s&&(r.base=r.name=0===h&&i?t.slice(1,s):t.slice(h,s)):(0===h&&i?(r.name=t.slice(1,a),r.base=t.slice(1,s)):(r.name=t.slice(h,a),r.base=t.slice(h,s)),r.ext=t.slice(a,s)),h>0?r.dir=t.slice(0,h-1):i&&(r.dir="/"),r},sep:"/",delimiter:":",win32:null,posix:null};n.posix=n,t.exports=n},447:(t,e,r)=>{var n;if(r.r(e),r.d(e,{URI:()=>g,Utils:()=>O}),"object"==typeof process)n="win32"===process.platform;else if("object"==typeof navigator){var o=navigator.userAgent;n=o.indexOf("Windows")>=0}var i,a,h=(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r])})(t,e)},function(t,e){function r(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}),s=/^\w[\w\d+.-]*$/,f=/^\//,u=/^\/\//,c="",l="/",p=/^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,g=function(){function t(t,e,r,n,o,i){void 0===i&&(i=!1),"object"==typeof t?(this.scheme=t.scheme||c,this.authority=t.authority||c,this.path=t.path||c,this.query=t.query||c,this.fragment=t.fragment||c):(this.scheme=function(t,e){return t||e?t:"file"}(t,i),this.authority=e||c,this.path=function(t,e){switch(t){case"https":case"http":case"file":e?e[0]!==l&&(e=l+e):e=l}return e}(this.scheme,r||c),this.query=n||c,this.fragment=o||c,function(t,e){if(!t.scheme&&e)throw new Error('[UriError]: Scheme is missing: {scheme: "", authority: "'+t.authority+'", path: "'+t.path+'", query: "'+t.query+'", fragment: "'+t.fragment+'"}');if(t.scheme&&!s.test(t.scheme))throw new Error("[UriError]: Scheme contains illegal characters.");if(t.path)if(t.authority){if(!f.test(t.path))throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character')}else if(u.test(t.path))throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")')}(this,i))}return t.isUri=function(e){return e instanceof t||!!e&&"string"==typeof e.authority&&"string"==typeof e.fragment&&"string"==typeof e.path&&"string"==typeof e.query&&"string"==typeof e.scheme&&"function"==typeof e.fsPath&&"function"==typeof e.with&&"function"==typeof e.toString},Object.defineProperty(t.prototype,"fsPath",{get:function(){return C(this,!1)},enumerable:!1,configurable:!0}),t.prototype.with=function(t){if(!t)return this;var e=t.scheme,r=t.authority,n=t.path,o=t.query,i=t.fragment;return void 0===e?e=this.scheme:null===e&&(e=c),void 0===r?r=this.authority:null===r&&(r=c),void 0===n?n=this.path:null===n&&(n=c),void 0===o?o=this.query:null===o&&(o=c),void 0===i?i=this.fragment:null===i&&(i=c),e===this.scheme&&r===this.authority&&n===this.path&&o===this.query&&i===this.fragment?this:new v(e,r,n,o,i)},t.parse=function(t,e){void 0===e&&(e=!1);var r=p.exec(t);return r?new v(r[2]||c,x(r[4]||c),x(r[5]||c),x(r[7]||c),x(r[9]||c),e):new v(c,c,c,c,c)},t.file=function(t){var e=c;if(n&&(t=t.replace(/\\/g,l)),t[0]===l&&t[1]===l){var r=t.indexOf(l,2);-1===r?(e=t.substring(2),t=l):(e=t.substring(2,r),t=t.substring(r)||l)}return new v("file",e,t,c,c)},t.from=function(t){return new v(t.scheme,t.authority,t.path,t.query,t.fragment)},t.prototype.toString=function(t){return void 0===t&&(t=!1),A(this,t)},t.prototype.toJSON=function(){return this},t.revive=function(e){if(e){if(e instanceof t)return e;var r=new v(e);return r._formatted=e.external,r._fsPath=e._sep===d?e.fsPath:null,r}return e},t}(),d=n?1:void 0,v=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._formatted=null,e._fsPath=null,e}return h(e,t),Object.defineProperty(e.prototype,"fsPath",{get:function(){return this._fsPath||(this._fsPath=C(this,!1)),this._fsPath},enumerable:!1,configurable:!0}),e.prototype.toString=function(t){return void 0===t&&(t=!1),t?A(this,!0):(this._formatted||(this._formatted=A(this,!1)),this._formatted)},e.prototype.toJSON=function(){var t={$mid:1};return this._fsPath&&(t.fsPath=this._fsPath,t._sep=d),this._formatted&&(t.external=this._formatted),this.path&&(t.path=this.path),this.scheme&&(t.scheme=this.scheme),this.authority&&(t.authority=this.authority),this.query&&(t.query=this.query),this.fragment&&(t.fragment=this.fragment),t},e}(g),m=((a={})[58]="%3A",a[47]="%2F",a[63]="%3F",a[35]="%23",a[91]="%5B",a[93]="%5D",a[64]="%40",a[33]="%21",a[36]="%24",a[38]="%26",a[39]="%27",a[40]="%28",a[41]="%29",a[42]="%2A",a[43]="%2B",a[44]="%2C",a[59]="%3B",a[61]="%3D",a[32]="%20",a);function y(t,e){for(var r=void 0,n=-1,o=0;o<t.length;o++){var i=t.charCodeAt(o);if(i>=97&&i<=122||i>=65&&i<=90||i>=48&&i<=57||45===i||46===i||95===i||126===i||e&&47===i)-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),void 0!==r&&(r+=t.charAt(o));else{void 0===r&&(r=t.substr(0,o));var a=m[i];void 0!==a?(-1!==n&&(r+=encodeURIComponent(t.substring(n,o)),n=-1),r+=a):-1===n&&(n=o)}}return-1!==n&&(r+=encodeURIComponent(t.substring(n))),void 0!==r?r:t}function b(t){for(var e=void 0,r=0;r<t.length;r++){var n=t.charCodeAt(r);35===n||63===n?(void 0===e&&(e=t.substr(0,r)),e+=m[n]):void 0!==e&&(e+=t[r])}return void 0!==e?e:t}function C(t,e){var r;return r=t.authority&&t.path.length>1&&"file"===t.scheme?"//"+t.authority+t.path:47===t.path.charCodeAt(0)&&(t.path.charCodeAt(1)>=65&&t.path.charCodeAt(1)<=90||t.path.charCodeAt(1)>=97&&t.path.charCodeAt(1)<=122)&&58===t.path.charCodeAt(2)?e?t.path.substr(1):t.path[1].toLowerCase()+t.path.substr(2):t.path,n&&(r=r.replace(/\//g,"\\")),r}function A(t,e){var r=e?b:y,n="",o=t.scheme,i=t.authority,a=t.path,h=t.query,s=t.fragment;if(o&&(n+=o,n+=":"),(i||"file"===o)&&(n+=l,n+=l),i){var f=i.indexOf("@");if(-1!==f){var u=i.substr(0,f);i=i.substr(f+1),-1===(f=u.indexOf(":"))?n+=r(u,!1):(n+=r(u.substr(0,f),!1),n+=":",n+=r(u.substr(f+1),!1)),n+="@"}-1===(f=(i=i.toLowerCase()).indexOf(":"))?n+=r(i,!1):(n+=r(i.substr(0,f),!1),n+=i.substr(f))}if(a){if(a.length>=3&&47===a.charCodeAt(0)&&58===a.charCodeAt(2))(c=a.charCodeAt(1))>=65&&c<=90&&(a="/"+String.fromCharCode(c+32)+":"+a.substr(3));else if(a.length>=2&&58===a.charCodeAt(1)){var c;(c=a.charCodeAt(0))>=65&&c<=90&&(a=String.fromCharCode(c+32)+":"+a.substr(2))}n+=r(a,!0)}return h&&(n+="?",n+=r(h,!1)),s&&(n+="#",n+=e?s:y(s,!1)),n}function w(t){try{return decodeURIComponent(t)}catch(e){return t.length>3?t.substr(0,3)+w(t.substr(3)):t}}var _=/(%[0-9A-Za-z][0-9A-Za-z])+/g;function x(t){return t.match(_)?t.replace(_,(function(t){return w(t)})):t}var O,P=r(470),j=function(){for(var t=0,e=0,r=arguments.length;e<r;e++)t+=arguments[e].length;var n=Array(t),o=0;for(e=0;e<r;e++)for(var i=arguments[e],a=0,h=i.length;a<h;a++,o++)n[o]=i[a];return n},U=P.posix||P;!function(t){t.joinPath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];return t.with({path:U.join.apply(U,j([t.path],e))})},t.resolvePath=function(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];var n=t.path||"/";return t.with({path:U.resolve.apply(U,j([n],e))})},t.dirname=function(t){var e=U.dirname(t.path);return 1===e.length&&46===e.charCodeAt(0)?t:t.with({path:e})},t.basename=function(t){return U.basename(t.path)},t.extname=function(t){return U.extname(t.path)}}(O||(O={}))}},e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={exports:{}};return t[n](o,o.exports,r),o.exports}return r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r(447)})();const{URI,Utils}=LIB;
//# sourceMappingURL=index.js.map

/***/ }),
/* 6 */
/***/ (function(module) {

/* global define */

(function (root, pluralize) {
  /* istanbul ignore else */
  if (true) {
    // Node.
    module.exports = pluralize();
  } else {}
})(this, function () {
  // Rule storage - pluralize and singularize need to be run sequentially,
  // while other rules can be optimized using an object for instant lookups.
  var pluralRules = [];
  var singularRules = [];
  var uncountables = {};
  var irregularPlurals = {};
  var irregularSingles = {};

  /**
   * Sanitize a pluralization rule to a usable regular expression.
   *
   * @param  {(RegExp|string)} rule
   * @return {RegExp}
   */
  function sanitizeRule (rule) {
    if (typeof rule === 'string') {
      return new RegExp('^' + rule + '$', 'i');
    }

    return rule;
  }

  /**
   * Pass in a word token to produce a function that can replicate the case on
   * another word.
   *
   * @param  {string}   word
   * @param  {string}   token
   * @return {Function}
   */
  function restoreCase (word, token) {
    // Tokens are an exact match.
    if (word === token) return token;

    // Lower cased words. E.g. "hello".
    if (word === word.toLowerCase()) return token.toLowerCase();

    // Upper cased words. E.g. "WHISKY".
    if (word === word.toUpperCase()) return token.toUpperCase();

    // Title cased words. E.g. "Title".
    if (word[0] === word[0].toUpperCase()) {
      return token.charAt(0).toUpperCase() + token.substr(1).toLowerCase();
    }

    // Lower cased words. E.g. "test".
    return token.toLowerCase();
  }

  /**
   * Interpolate a regexp string.
   *
   * @param  {string} str
   * @param  {Array}  args
   * @return {string}
   */
  function interpolate (str, args) {
    return str.replace(/\$(\d{1,2})/g, function (match, index) {
      return args[index] || '';
    });
  }

  /**
   * Replace a word using a rule.
   *
   * @param  {string} word
   * @param  {Array}  rule
   * @return {string}
   */
  function replace (word, rule) {
    return word.replace(rule[0], function (match, index) {
      var result = interpolate(rule[1], arguments);

      if (match === '') {
        return restoreCase(word[index - 1], result);
      }

      return restoreCase(match, result);
    });
  }

  /**
   * Sanitize a word by passing in the word and sanitization rules.
   *
   * @param  {string}   token
   * @param  {string}   word
   * @param  {Array}    rules
   * @return {string}
   */
  function sanitizeWord (token, word, rules) {
    // Empty string or doesn't need fixing.
    if (!token.length || uncountables.hasOwnProperty(token)) {
      return word;
    }

    var len = rules.length;

    // Iterate over the sanitization rules and use the first one to match.
    while (len--) {
      var rule = rules[len];

      if (rule[0].test(word)) return replace(word, rule);
    }

    return word;
  }

  /**
   * Replace a word with the updated word.
   *
   * @param  {Object}   replaceMap
   * @param  {Object}   keepMap
   * @param  {Array}    rules
   * @return {Function}
   */
  function replaceWord (replaceMap, keepMap, rules) {
    return function (word) {
      // Get the correct token and case restoration functions.
      var token = word.toLowerCase();

      // Check against the keep object map.
      if (keepMap.hasOwnProperty(token)) {
        return restoreCase(word, token);
      }

      // Check against the replacement map for a direct word replacement.
      if (replaceMap.hasOwnProperty(token)) {
        return restoreCase(word, replaceMap[token]);
      }

      // Run all the rules against the word.
      return sanitizeWord(token, word, rules);
    };
  }

  /**
   * Check if a word is part of the map.
   */
  function checkWord (replaceMap, keepMap, rules, bool) {
    return function (word) {
      var token = word.toLowerCase();

      if (keepMap.hasOwnProperty(token)) return true;
      if (replaceMap.hasOwnProperty(token)) return false;

      return sanitizeWord(token, token, rules) === token;
    };
  }

  /**
   * Pluralize or singularize a word based on the passed in count.
   *
   * @param  {string}  word      The word to pluralize
   * @param  {number}  count     How many of the word exist
   * @param  {boolean} inclusive Whether to prefix with the number (e.g. 3 ducks)
   * @return {string}
   */
  function pluralize (word, count, inclusive) {
    var pluralized = count === 1
      ? pluralize.singular(word) : pluralize.plural(word);

    return (inclusive ? count + ' ' : '') + pluralized;
  }

  /**
   * Pluralize a word.
   *
   * @type {Function}
   */
  pluralize.plural = replaceWord(
    irregularSingles, irregularPlurals, pluralRules
  );

  /**
   * Check if a word is plural.
   *
   * @type {Function}
   */
  pluralize.isPlural = checkWord(
    irregularSingles, irregularPlurals, pluralRules
  );

  /**
   * Singularize a word.
   *
   * @type {Function}
   */
  pluralize.singular = replaceWord(
    irregularPlurals, irregularSingles, singularRules
  );

  /**
   * Check if a word is singular.
   *
   * @type {Function}
   */
  pluralize.isSingular = checkWord(
    irregularPlurals, irregularSingles, singularRules
  );

  /**
   * Add a pluralization rule to the collection.
   *
   * @param {(string|RegExp)} rule
   * @param {string}          replacement
   */
  pluralize.addPluralRule = function (rule, replacement) {
    pluralRules.push([sanitizeRule(rule), replacement]);
  };

  /**
   * Add a singularization rule to the collection.
   *
   * @param {(string|RegExp)} rule
   * @param {string}          replacement
   */
  pluralize.addSingularRule = function (rule, replacement) {
    singularRules.push([sanitizeRule(rule), replacement]);
  };

  /**
   * Add an uncountable word rule.
   *
   * @param {(string|RegExp)} word
   */
  pluralize.addUncountableRule = function (word) {
    if (typeof word === 'string') {
      uncountables[word.toLowerCase()] = true;
      return;
    }

    // Set singular and plural references for the word.
    pluralize.addPluralRule(word, '$0');
    pluralize.addSingularRule(word, '$0');
  };

  /**
   * Add an irregular word definition.
   *
   * @param {string} single
   * @param {string} plural
   */
  pluralize.addIrregularRule = function (single, plural) {
    plural = plural.toLowerCase();
    single = single.toLowerCase();

    irregularSingles[single] = plural;
    irregularPlurals[plural] = single;
  };

  /**
   * Irregular rules.
   */
  [
    // Pronouns.
    ['I', 'we'],
    ['me', 'us'],
    ['he', 'they'],
    ['she', 'they'],
    ['them', 'them'],
    ['myself', 'ourselves'],
    ['yourself', 'yourselves'],
    ['itself', 'themselves'],
    ['herself', 'themselves'],
    ['himself', 'themselves'],
    ['themself', 'themselves'],
    ['is', 'are'],
    ['was', 'were'],
    ['has', 'have'],
    ['this', 'these'],
    ['that', 'those'],
    // Words ending in with a consonant and `o`.
    ['echo', 'echoes'],
    ['dingo', 'dingoes'],
    ['volcano', 'volcanoes'],
    ['tornado', 'tornadoes'],
    ['torpedo', 'torpedoes'],
    // Ends with `us`.
    ['genus', 'genera'],
    ['viscus', 'viscera'],
    // Ends with `ma`.
    ['stigma', 'stigmata'],
    ['stoma', 'stomata'],
    ['dogma', 'dogmata'],
    ['lemma', 'lemmata'],
    ['schema', 'schemata'],
    ['anathema', 'anathemata'],
    // Other irregular rules.
    ['ox', 'oxen'],
    ['axe', 'axes'],
    ['die', 'dice'],
    ['yes', 'yeses'],
    ['foot', 'feet'],
    ['eave', 'eaves'],
    ['goose', 'geese'],
    ['tooth', 'teeth'],
    ['quiz', 'quizzes'],
    ['human', 'humans'],
    ['proof', 'proofs'],
    ['carve', 'carves'],
    ['valve', 'valves'],
    ['looey', 'looies'],
    ['thief', 'thieves'],
    ['groove', 'grooves'],
    ['pickaxe', 'pickaxes'],
    ['passerby', 'passersby']
  ].forEach(function (rule) {
    return pluralize.addIrregularRule(rule[0], rule[1]);
  });

  /**
   * Pluralization rules.
   */
  [
    [/s?$/i, 's'],
    [/[^\u0000-\u007F]$/i, '$0'],
    [/([^aeiou]ese)$/i, '$1'],
    [/(ax|test)is$/i, '$1es'],
    [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, '$1es'],
    [/(e[mn]u)s?$/i, '$1s'],
    [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, '$1'],
    [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1i'],
    [/(alumn|alg|vertebr)(?:a|ae)$/i, '$1ae'],
    [/(seraph|cherub)(?:im)?$/i, '$1im'],
    [/(her|at|gr)o$/i, '$1oes'],
    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i, '$1a'],
    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, '$1a'],
    [/sis$/i, 'ses'],
    [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, '$1$2ves'],
    [/([^aeiouy]|qu)y$/i, '$1ies'],
    [/([^ch][ieo][ln])ey$/i, '$1ies'],
    [/(x|ch|ss|sh|zz)$/i, '$1es'],
    [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, '$1ices'],
    [/\b((?:tit)?m|l)(?:ice|ouse)$/i, '$1ice'],
    [/(pe)(?:rson|ople)$/i, '$1ople'],
    [/(child)(?:ren)?$/i, '$1ren'],
    [/eaux$/i, '$0'],
    [/m[ae]n$/i, 'men'],
    ['thou', 'you']
  ].forEach(function (rule) {
    return pluralize.addPluralRule(rule[0], rule[1]);
  });

  /**
   * Singularization rules.
   */
  [
    [/s$/i, ''],
    [/(ss)$/i, '$1'],
    [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, '$1fe'],
    [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, '$1f'],
    [/ies$/i, 'y'],
    [/\b([pl]|zomb|(?:neck|cross)?t|coll|faer|food|gen|goon|group|lass|talk|goal|cut)ies$/i, '$1ie'],
    [/\b(mon|smil)ies$/i, '$1ey'],
    [/\b((?:tit)?m|l)ice$/i, '$1ouse'],
    [/(seraph|cherub)im$/i, '$1'],
    [/(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$/i, '$1'],
    [/(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$/i, '$1sis'],
    [/(movie|twelve|abuse|e[mn]u)s$/i, '$1'],
    [/(test)(?:is|es)$/i, '$1is'],
    [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1us'],
    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i, '$1um'],
    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i, '$1on'],
    [/(alumn|alg|vertebr)ae$/i, '$1a'],
    [/(cod|mur|sil|vert|ind)ices$/i, '$1ex'],
    [/(matr|append)ices$/i, '$1ix'],
    [/(pe)(rson|ople)$/i, '$1rson'],
    [/(child)ren$/i, '$1'],
    [/(eau)x?$/i, '$1'],
    [/men$/i, 'man']
  ].forEach(function (rule) {
    return pluralize.addSingularRule(rule[0], rule[1]);
  });

  /**
   * Uncountable rules.
   */
  [
    // Singular words with no plurals.
    'adulthood',
    'advice',
    'agenda',
    'aid',
    'aircraft',
    'alcohol',
    'ammo',
    'analytics',
    'anime',
    'athletics',
    'audio',
    'bison',
    'blood',
    'bream',
    'buffalo',
    'butter',
    'carp',
    'cash',
    'chassis',
    'chess',
    'clothing',
    'cod',
    'commerce',
    'cooperation',
    'corps',
    'debris',
    'diabetes',
    'digestion',
    'elk',
    'energy',
    'equipment',
    'excretion',
    'expertise',
    'firmware',
    'flounder',
    'fun',
    'gallows',
    'garbage',
    'graffiti',
    'hardware',
    'headquarters',
    'health',
    'herpes',
    'highjinks',
    'homework',
    'housework',
    'information',
    'jeans',
    'justice',
    'kudos',
    'labour',
    'literature',
    'machinery',
    'mackerel',
    'mail',
    'media',
    'mews',
    'moose',
    'music',
    'mud',
    'manga',
    'news',
    'only',
    'personnel',
    'pike',
    'plankton',
    'pliers',
    'police',
    'pollution',
    'premises',
    'rain',
    'research',
    'rice',
    'salmon',
    'scissors',
    'series',
    'sewage',
    'shambles',
    'shrimp',
    'software',
    'species',
    'staff',
    'swine',
    'tennis',
    'traffic',
    'transportation',
    'trout',
    'tuna',
    'wealth',
    'welfare',
    'whiting',
    'wildebeest',
    'wildlife',
    'you',
    /pok[eé]mon$/i,
    // Regexes.
    /[^aeiou]ese$/i, // "chinese", "japanese"
    /deer$/i, // "deer", "reindeer"
    /fish$/i, // "fish", "blowfish", "angelfish"
    /measles$/i,
    /o[iu]s$/i, // "carnivorous"
    /pox$/i, // "chickpox", "smallpox"
    /sheep$/i
  ].forEach(pluralize.addUncountableRule);

  return pluralize;
});


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const vscode = __webpack_require__(2);
const path = __webpack_require__(8);
class SchemaTreeDataProvider {
    constructor(model) {
        this.model = model;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this.model.refreshSchema();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return {
            label: element.label,
            description: element.description,
            tooltip: element.tooltip,
            contextValue: element.isTable ? "schemaTable" : "schemaField",
            collapsibleState: element.isTable
                ? vscode.TreeItemCollapsibleState.Collapsed
                : void 0,
            iconPath: element.isTable
                ? {
                    light: path.join(__filename, "..", "..", "resources", "light", "table.svg"),
                    dark: path.join(__filename, "..", "..", "resources", "dark", "table.svg"),
                }
                : element.tooltip
                    ? {
                        light: path.join(__filename, "..", "..", "resources", "light", "comments.svg"),
                        dark: path.join(__filename, "..", "..", "resources", "dark", "comments.svg"),
                    }
                    : path.join(__filename, "not existing")
        };
    }
    getChildren(element) {
        return element ? element.children : this.model.data;
    }
    getParent(element) {
        return element.parent;
    }
}
exports["default"] = SchemaTreeDataProvider;


/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const SchemaExplorer_1 = __webpack_require__(1);
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    new SchemaExplorer_1.SchemaExplorer(context);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map