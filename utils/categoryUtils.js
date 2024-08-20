import fs from "fs";
import path from "path";
import anthropicChat from "./anthropic.js";
import openaiChat from "./openai.js";
import { categorizePrompt, organizeInOneShotPrompt } from "./prompts.js";
import ollamaChat from "./ollama.js";
import { geminiChat } from "./gemini.js";
import { alternate } from "../test.js";
import dotenv from "dotenv";
dotenv.config();
let apikeys = [process.env.GOOGLE_GEMINI_API_KEY, process.env.GOOGLE_GEMINI_API_KEY2]
let selectedIndex = 0;
/**
 * Reads and parses the JSON file containing categories.
 *
 * @param {string} filePath - The path to the JSON file containing categories.
 * @returns {Object} - The parsed JSON object containing categories.
 */
function getCategories(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Asynchronously categorizes the given files based on the specified category type and content.
 *
 * @param {Array} files - An array of objects, where each object has 'file' and 'content' properties.
 * @param {string} categoryType - The name of the category type to use for categorization.
 * @param {Array} currentFolders - An array of current folders for context.
 * @returns {Object} - An object containing the categorized files, where the keys are categories and the values are arrays of file names.
 */
async function categorizeFiles(files, categoryType, currentFolders, bridge) {
    const categories = getCategories('data/categories.json');
    let selectedCategorizer = categories.filter(category => category.name === categoryType)[0];

    const categorizedFiles = {};
    let totalFiles = files.length;
    let current = 0;
    for (const { file, content } of files) {
        current++;
        bridge.broadcast("ai-progress", {
            current,
            total: totalFiles,

        });
        let fileName = file.replace(/^.*[\\\/]/, '')
        const category = await getCategory(fileName, content, selectedCategorizer.promptForAI, currentFolders);
        if (category == "Skip")
            continue;
        if (!categorizedFiles[category]) {
            categorizedFiles[category] = [];
        }
        categorizedFiles[category].push(file);
    }
    bridge.broadcast("ai-progress-done");
    return categorizedFiles;
}
async function categorizeFilesInOneShot(files, categoryType, includedFolders) {
    const categories = getCategories("data/categories.json");
    let selectedCategorizer = categories.filter(
        (category) => category.name === categoryType
    )[0];

    let structure = {};
    structure.folders = includedFolders;

    structure.files = files.map((file) => ({
        file: file.file,
        content: file.content.substring(0, 1000),
    }));

    let categorizeMsg = organizeInOneShotPrompt(JSON.stringify(structure));
    let selectedApiKey = apikeys[selectedIndex];
    // let response = await anthropicChat(categorizeMsg, "son");
    let response = await openaiChat(categorizeMsg, "son");
    console.log(response.content);
    return response.content;
}

/**
 * Asynchronously categorizes the given files based on the specified category type and content.
 *
 * @param {string} content - The content of the file to categorize.
 * @param {string} prompt - The prompt to use for categorization.
 * @param {Array} currentFolders - An array of current folders for context.
 * @returns {Promise<string>} - A Promise that resolves to the categorized file.
 */
async function getCategory(fileName, content, prompt, currentFolders) {

    content = content.substring(0, 1000);
    let categorizeMsg = categorizePrompt(
        fileName,
        content,
        currentFolders,
        prompt
    );
    let selectedApiKey = apikeys[selectedIndex];
    let category = await anthropicChat(selectedApiKey, categorizeMsg);
    // Sıradaki indeksi ayarla
    selectedIndex = (selectedIndex + 1) % apikeys.length;
    let folderName = category.content;

    if (folderName.trim() === "") {
        return "Skip";
    }

    return folderName.replace(/\r?\n|\r/g, "").trim();
    // Additional code for other categorization types can be added here
}

export { getCategories, categorizeFiles, categorizeFilesInOneShot };