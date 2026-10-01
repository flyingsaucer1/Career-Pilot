const mongoose = require('mongoose');
const { connectDatabase } = require('../dist/config/db');
const { Resume } = require('../dist/models/Resume.model');
const { PendingFileDeletion } = require('../dist/models/PendingFileDeletion.model');
const { promoteFileToAuthenticated, getAuthenticatedFileUrl } = require('../dist/services/cloudinary.service');

const apply = process.argv.includes('--apply');
const verify = process.argv.includes('--verify');
const legacyQuery = { cloudinaryDeliveryType: { $ne: 'authenticated' } };

async function main() {
  await connectDatabase();
  const count = await Resume.countDocuments(legacyQuery);
  const pendingCleanup = await PendingFileDeletion.countDocuments({ deliveryType: { $ne: 'authenticated' } });
  console.log(`${count} legacy public resume asset(s) found.`);
  console.log(`${pendingCleanup} legacy public asset(s) already pending deletion.`);
  if (verify) {
    let checked = 0;
    let missing = 0;
    const privateResumes = Resume.find({ cloudinaryDeliveryType: 'authenticated' })
      .select('cloudinaryPublicId').cursor();
    for await (const resume of privateResumes) {
      checked++;
      if (!(await getAuthenticatedFileUrl(resume.cloudinaryPublicId))) missing++;
    }
    if (missing) throw new Error(`${missing} of ${checked} authenticated asset(s) missing in Cloudinary.`);
    console.log(`Verified ${checked} authenticated asset(s) in Cloudinary.`);
    return;
  }
  if (!apply) {
    console.log('Dry run only. Use --apply to convert them; previously shared public links will stop working.');
    return;
  }

  let converted = 0;
  const cursor = Resume.find(legacyQuery).select('_id cloudinaryPublicId').cursor();
  for await (const resume of cursor) {
    let privateUrl;
    try {
      privateUrl = await promoteFileToAuthenticated(resume.cloudinaryPublicId);
    } catch (error) {
      // If the rename succeeded but the previous database update failed,
      // a repeat run can finish the metadata update without touching the asset.
      privateUrl = await getAuthenticatedFileUrl(resume.cloudinaryPublicId);
      if (!privateUrl) throw error;
    }
    if (!privateUrl) throw new Error('Cloudinary returned no authenticated asset URL.');
    const result = await Resume.updateOne(
      { _id: resume._id, cloudinaryDeliveryType: { $ne: 'authenticated' } },
      { $set: { cloudinaryDeliveryType: 'authenticated', cloudinaryUrl: privateUrl } }
    );
    if (result.modifiedCount !== 1) throw new Error('Resume metadata changed during migration. Retry after inspection.');
    converted++;
  }
  console.log(`Converted ${converted} resume asset(s) to authenticated delivery.`);
}

main().catch((error) => {
  console.error('Migration stopped. Re-running is safe after checking the failure:', error.message || error.name);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
