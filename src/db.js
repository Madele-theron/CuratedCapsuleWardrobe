import Dexie from 'dexie';

export const db = new Dexie('WardrobeHubDB');

// Database stores:
// - items: Shopping list items (id, name, category, price, status, urls, image, dateCreated)
// - swatches: Color & texture swatches (id, type ['color'|'texture'], data [hex|imageUrl], name)
// - scrapbookElements: Placed items on the scrapbooks (id, scrapbookId, type, content, x, y, width, height, zIndex)
// - scrapbooks: Pages/outfit recreation setups (id, name, coverImage)

db.version(3).stores({
  items: '++id, name, category, status, dateCreated',
  swatches: '++id, type, name',
  scrapbooks: '++id, name',
  scrapbookElements: '++id, scrapbookId, type',
  inspoPhotos: '++id, dateCreated',
  todos: '++id, text, isDone, dateCreated'
});

export default db;
