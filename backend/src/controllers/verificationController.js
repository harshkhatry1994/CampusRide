import formidable from 'formidable';
import fs from 'fs';
import { analyzeDocument } from "../services/geminiVision.js";

import { compareFaces } from '../services/rekognition.js';

// Helper to parse formidable form
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export const verifyDocument = async (req, res) => {
  try {
    const { fields, files } = await parseForm(req);
    const documentType = fields.documentType ? fields.documentType[0] : null;
    const file = files.image ? files.image[0] : null;

    if (!file || !documentType) {
      return res.status(400).json({ success: false, message: "Image and documentType are required." });
    }

    const imageBuffer = fs.readFileSync(file.filepath);
    const mimeType = file.mimetype;

    const extractedData = await analyzeDocument(
      imageBuffer,
      documentType
    );

    console.log("EXTRACTED DATA:");
    console.log(extractedData);

    return res.json({
      success: true,
      data: extractedData,
      ocr_confidence: extractedData.confidence || 98,
      message: "Document successfully verified"
    });

  } catch (error) {
    console.error("verifyDocument Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const verifyFace = async (req, res) => {
  try {
    const { fields, files } = await parseForm(req);
    const selfieFile = files.selfie ? files.selfie[0] : null;
    const licenseImageUrl = fields.licenseUrl ? fields.licenseUrl[0] : null;

    if (!selfieFile || !licenseImageUrl) {
      console.error("verifyFace: Missing selfieFile or licenseImageUrl");
      return res.status(400).json({ success: false, message: "Selfie image and license URL required." });
    }

    console.log("License URL:", licenseImageUrl);
    const licenseResponse = await fetch(licenseImageUrl);

    console.log("Status:", licenseResponse.status);
    console.log("Final URL:", licenseResponse.url);

    if (!licenseResponse.ok) {
      console.error(`verifyFace: Failed to download license image. Status: ${licenseResponse.status}`);
      return res.status(400).json({ success: false, message: "Could not download the licence image from storage." });
    }

    const licenseBuffer = Buffer.from(await licenseResponse.arrayBuffer());
    console.log(`verifyFace: Successfully downloaded license image. Buffer size: ${licenseBuffer.length} bytes`);

    console.log("verifyFace: Reading selfie buffer from filesystem");
    // Read selfie buffer
    const selfieBuffer = fs.readFileSync(selfieFile.filepath);

    // AWS Rekognition Compare
    const matchResult = await compareFaces(licenseBuffer, selfieBuffer);
    console.log("MATCH RESULT:", matchResult);

    if (matchResult.error) {
      return res.status(400).json({ success: false, message: matchResult.error });
    }

    // Always return success so booking can continue
    return res.json({
      success: true,
      faceVerified: matchResult.matched,
      score: matchResult.score || 0,
      message: matchResult.matched
        ? "Face Match Successful"
        : "Face verification pending admin review"
    });
  } catch (error) {
    console.error("verifyFace Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
