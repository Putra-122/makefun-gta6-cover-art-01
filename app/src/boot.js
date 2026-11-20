// Boot: pick the editor or a screenshot scene from the URL query.
import { startEditor } from './main.js';
import { shootCover } from './shots.js';

const query = new URLSearchParams(location.search);
if (query.get('shot') === 'cover') {
  shootCover(query);
} else {
  startEditor(query);
}
