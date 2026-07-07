import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import dotenv from 'dotenv';
dotenv.config();

const client = new RekognitionClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Compares a live selfie with a photo from an ID document
 * @param {Buffer} sourceImageBuffer - The Driving License / ID photo
 * @param {Buffer} targetImageBuffer - The Live Selfie
 * @returns {Object} { matched: boolean, score: number }
 */
export const compareFaces = async (sourceImageBuffer, targetImageBuffer) => {
  try {
    console.log("License Buffer:", sourceImageBuffer.length);
    console.log("Selfie Buffer:", targetImageBuffer.length);

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceImageBuffer },
      TargetImage: { Bytes: targetImageBuffer },
      SimilarityThreshold: 60.0,
    });

    const response = await client.send(command);
    
    console.log("Rekognition Response:", JSON.stringify(response, null, 2));

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const match = response.FaceMatches[0];

      console.log("Similarity Score:", match.Similarity);

      return {
        matched: match.Similarity >= 60.0,
        score: match.Similarity,
      };
    } else {
      // It's possible there's an unmatched face
      if (response.UnmatchedFaces && response.UnmatchedFaces.length > 0) {
         return {
           matched: false,
           score: 0,
         };
      }
      return {
        matched: false,
        score: 0,
        error: "No face detected in selfie" // Since SourceImage is verified by Rekognition to have a face before reaching here usually
      };
    }
  } catch (error) {
    console.error("Rekognition CompareFaces Error:", error);
    
    // AWS throws specific errors when no faces are detected
    if (error.message && error.message.toLowerCase().includes('no faces in the source image')) {
       throw new Error("No face detected in licence");
    }
    if (error.message && error.message.toLowerCase().includes('no faces in the target image')) {
       throw new Error("No face detected in selfie");
    }
    
    throw new Error("Face Match Failed: " + error.message);
  }
};
