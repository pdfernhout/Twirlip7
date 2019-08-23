# Run by hand to copy latest files from node_modules to ui/vendor after updating package.json.
# You might want to delete ui/vendor subdirectories first to remove clutter if there is a signficant change.

# ace-diff.js is not copied by this script. It is an older version than what is in npm.
# References to ace-diff.js in a Notebook example should be updated to use latest files in the ace-diff folder.

mkdir -p src/ui/vendor/ace-src-noconflict/
cp -R node_modules/ace-builds/src-noconflict/* src/ui/vendor/ace-src-noconflict/

mkdir -p src/ui/vendor/ace-diff/
cp -R node_modules/ace-diff/dist/* src/ui/vendor/ace-diff/

cp node_modules/diff-match-patch/index.js src/ui/vendor/diff_match_patch_uncompressed.js

cp node_modules/dompurify/dist/purify.js src/ui/vendor/

cp node_modules/js-sha256/src/sha256.js src/ui/vendor/

cp node_modules/mithril/mithril.js src/ui/vendor/

mkdir -p src/ui/vendor/font-awesome/css
mkdir -p src/ui/vendor/font-awesome/fonts
cp -R node_modules/font-awesome/css/font-awesome.css src/ui/vendor/font-awesome/css
cp -R node_modules/font-awesome/fonts/* src/ui/vendor/font-awesome/fonts

cp node_modules/marked/lib/marked.js src/ui/vendor/

cp node_modules/push.js/bin/push.js src/ui/vendor/

cp node_modules/requirejs/require.js src/ui/vendor/

cp node_modules/requirejs-text/text.js src/ui/vendor/

cp node_modules/socket.io-client/dist/socket.io.js src/ui/vendor/

cp node_modules/tachyons/css/tachyons.css src/ui/vendor/

cp node_modules/three/build/three.js src/ui/vendor/
