const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Use public DNS to ensure MongoDB Atlas SRV resolution across all OS network setups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/draftyard';

const defaultGithubObj = {
  connected: false,
  githubId: null,
  username: null,
  displayName: null,
  avatarUrl: null,
  profileUrl: null,
  accessToken: null,
  connectedAt: null,
};

async function migrateGithubSchema() {
  console.log('================================================');
  console.log('Starting GitHub Schema Migration & Verification');
  console.log('================================================');
  console.log(`Target MONGO_URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collectionName = 'users';
    const usersCollection = db.collection(collectionName);

    console.log(`[SUCCESS] MongoDB connected`);
    console.log(`Database name: ${db.databaseName}`);
    console.log(`Collection name: ${collectionName}`);

    // Fetch total count & all user documents
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`Total users found in collection: ${totalUsers}`);

    const cursor = usersCollection.find({});
    let scanned = 0;
    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    while (await cursor.hasNext()) {
      const user = await cursor.next();
      scanned++;

      const isLegacyString = typeof user.github === 'string';
      const isMissingOrInvalid =
        user.github === undefined ||
        user.github === null ||
        typeof user.github !== 'object' ||
        Array.isArray(user.github);

      if (isLegacyString || isMissingOrInvalid) {
        try {
          const res = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { github: defaultGithubObj } }
          );
          if (res.modifiedCount > 0 || res.matchedCount > 0) {
            migrated++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Failed to migrate user ${user._id}:`, err.message);
          failed++;
        }
      } else {
        skipped++;
      }
    }

    console.log('\n--- Migration Results Summary ---');
    console.log(`Total users found:   ${totalUsers}`);
    console.log(`Total users scanned: ${scanned}`);
    console.log(`Users migrated:     ${migrated}`);
    console.log(`Users skipped:      ${skipped}`);
    console.log(`Users failed:       ${failed}`);
    console.log('---------------------------------');

    // Post-migration Verification
    console.log('\nRunning Post-Migration Verification...');
    const legacyDocs = await usersCollection.find({ github: "" }).toArray();
    const stringDocs = await usersCollection.find({ github: { $type: "string" } }).toArray();

    if (legacyDocs.length === 0 && stringDocs.length === 0) {
      console.log('[VERIFIED] 0 user documents contain legacy github string ("")');
      console.log('Migration verified successfully.');
    } else {
      console.error(`[VERIFICATION FAILURE] Found ${legacyDocs.length + stringDocs.length} document(s) with string github field!`);
      stringDocs.forEach(doc => {
        console.error(`Skipped User ID: ${doc._id}, Email: ${doc.email}, value:`, doc.github);
      });
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);

  } catch (err) {
    console.error('[CRITICAL FAILURE] Migration error:', err.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

if (require.main === module) {
  migrateGithubSchema();
}

module.exports = migrateGithubSchema;
