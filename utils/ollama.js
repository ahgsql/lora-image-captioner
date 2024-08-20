import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import fs from "fs/promises";

dotenv.config();

async function fileToBase64(filePath) {
    try {
        const data = await fs.readFile(filePath);
        return Buffer.from(data).toString('base64');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

export default async function ollamaChat(msgArr, model = "moondream") {
    console.log("ollama chat started");
    const systemMessage = msgArr.find((msg) => msg.role === "system")?.content || "";
    const userMessages = await Promise.all(
        msgArr.filter((msg) => msg.role !== "system").map(async (msg) => {
            if (msg.images) {
                const base64Images = await Promise.all(
                    msg.images.map(async (imagePath) => {
                        try {
                            return await fileToBase64(imagePath);
                        } catch (error) {
                            console.error(`Error converting image ${imagePath} to base64:`, error);
                            return null;
                        }
                    })
                );
                return { ...msg, images: base64Images.filter(img => img !== null) };
            } else {
                return msg;
            }
        })
    );
    try {
        const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });
        const response = await ollama.chat({
            model: model,
            messages: [{ role: "system", content: systemMessage }, ...userMessages],
        });
        return {
            content: response.message.content,
        };
    } catch (error) {
        console.error(error.message);
        return {
            content: "",
            usage: null,
        };
    }
}
