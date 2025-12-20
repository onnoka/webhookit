const fs = require('fs');
const path = require('path');

const VINYLS_FILE = path.join(__dirname, 'data', 'vinyls.json');

// Normalize string for comparison (lowercase, remove special chars)
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

// Main cleanup function
function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...\n');

  // Read vinyls
  const data = fs.readFileSync(VINYLS_FILE, 'utf8');
  const db = JSON.parse(data);
  const vinyls = db.vinyls || [];

  console.log(`📊 Total vinyls before cleanup: ${vinyls.length}`);

  // Group by normalized artist + title
  const groups = {};

  vinyls.forEach(vinyl => {
    const key = normalizeString(vinyl.artist) + '|' + normalizeString(vinyl.title);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(vinyl);
  });

  // Find duplicates
  const toKeep = [];
  const toDelete = [];
  let duplicateGroups = 0;

  Object.entries(groups).forEach(([key, vinylsInGroup]) => {
    if (vinylsInGroup.length === 1) {
      // No duplicates, keep it
      toKeep.push(vinylsInGroup[0]);
    } else {
      // Duplicates found!
      duplicateGroups++;

      // Sort by createdAt (oldest first)
      vinylsInGroup.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      // Keep the oldest one
      const oldest = vinylsInGroup[0];
      const duplicates = vinylsInGroup.slice(1);

      toKeep.push(oldest);
      toDelete.push(...duplicates);

      console.log(`\n🔍 Found ${vinylsInGroup.length} copies of:`);
      console.log(`   "${oldest.artist} - ${oldest.title}"`);
      console.log(`   ✅ Keeping: ${oldest.id} (${new Date(oldest.createdAt).toLocaleDateString('nl-NL')})`);
      duplicates.forEach(dup => {
        console.log(`   ❌ Deleting: ${dup.id} (${new Date(dup.createdAt).toLocaleDateString('nl-NL')})`);
      });
    }
  });

  console.log(`\n\n📈 Summary:`);
  console.log(`   Duplicate groups found: ${duplicateGroups}`);
  console.log(`   Vinyls to keep: ${toKeep.length}`);
  console.log(`   Vinyls to delete: ${toDelete.length}`);

  // Create backup
  const backupFile = VINYLS_FILE + '.backup-' + Date.now();
  fs.writeFileSync(backupFile, data);
  console.log(`\n💾 Backup saved: ${backupFile}`);

  // Save cleaned data with same structure
  const cleanedDb = { vinyls: toKeep };
  fs.writeFileSync(VINYLS_FILE, JSON.stringify(cleanedDb, null, 2));
  console.log(`✅ Cleaned data saved!`);
  console.log(`\n🎉 Done! ${toDelete.length} duplicates removed.`);
}

// Run cleanup
try {
  cleanupDuplicates();
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}
