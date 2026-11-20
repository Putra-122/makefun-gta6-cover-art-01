// Boot: shot scenes (?shot=cover / ?shot=editor) go to shots.js,
// the normal editor goes to main.js.
const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  await import('./shots.js');
} else {
  await import('./main.js');
}
