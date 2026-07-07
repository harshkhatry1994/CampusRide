import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeDocument = async (imageBuffer, documentType) => {
  console.log("=== GEMINI DEBUG ===");
  console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "YES (length: " + process.env.GEMINI_API_KEY.length + ")" : "NO - UNDEFINED");
  console.log("Document type:", documentType);
  console.log("Image buffer size:", imageBuffer?.length, "bytes");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an Indian identity document verification AI.

Expected document: ${documentType}

First determine whether the uploaded image is actually a ${documentType}.

If it is NOT a ${documentType}, return ONLY:

{
  "documentType":"unknown",
  "validImage":false,
  "confidence":0,
  "reason":"Uploaded document is not a ${documentType}"
}

If it IS a ${documentType}, extract:

{
  "documentType":"",
  "validImage":true,
  "confidence":98,
  "name":"",
  "dob":"",
  "documentNumber":"",
  "expiry":"",
  "address":"",
  "state":"",
  "imageQuality":"good",
  "reason":""
}

Return ONLY JSON.
Never explain.
`;

  const imageParts = [
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    },
  ];

  try {
    console.log("Calling Gemini API...");
    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    console.log("Gemini raw response:", responseText);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Gemini did not return valid JSON.\n" + responseText);
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log("Parsed Gemini data:", parsedData);
    return parsedData;
  } catch (error) {
    console.error("=== GEMINI ERROR DETAILS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Error statusText:", error.statusText);
    console.error("Full error:", error);
    console.error("============================");
    throw error;
  }
};
