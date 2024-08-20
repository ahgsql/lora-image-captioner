import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import ollamaChat from "./ollama.js";

dotenv.config();

async function captionImage(imagePath, model, prefix, suffix, customPrompt) {
  try {
    const { content } = await ollamaChat(
      [
        {
          role: "user",
          content: customPrompt,
          images: [imagePath],
        },
      ],
      model
    );

    const caption = `${prefix}${content}${suffix}`;
    console.log("Generated caption:", caption);

    return caption;
  } catch (error) {
    console.error("Error in captionImage:", error);
    throw error;
  }
}

export async function captionImagesInFolder(folderPath, model, renameImages, prefix = '', suffix = '', customPrompt = 'Describe this image shortly.') {
  try {
    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter((file) =>
      [".jpg", ".jpeg", ".png", ".gif", ".bmp"].includes(
        path.extname(file).toLowerCase()
      )
    );

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const imagePath = path.join(folderPath, imageFile);
      const caption = await captionImage(imagePath, model, prefix, suffix, customPrompt);

      let newImageName = imageFile;
      if (renameImages) {
        const ext = path.extname(imageFile);
        newImageName = `${i + 1}${ext}`;
        const newImagePath = path.join(folderPath, newImageName);
        await fs.rename(imagePath, newImagePath);
      }

      const captionFileName = `${path.basename(newImageName, path.extname(newImageName))}.txt`;
      const captionFilePath = path.join(folderPath, captionFileName);

      await fs.writeFile(captionFilePath, caption);

      console.log(`Caption saved to ${captionFilePath}`);
    }

    console.log("All images in the folder have been captioned.");
  } catch (error) {
    console.error("Error in captionImagesInFolder:", error);
    throw error;
  }
}
