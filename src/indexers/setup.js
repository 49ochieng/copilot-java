const { AzureKeyCredential, SearchClient, SearchIndexClient } = require("@azure/search-documents");
const { createIndexIfNotExists, delay, upsertDocuments, getEmbeddingVector } = require("./utils");
const path = require("path");
const fs = require("fs");

/**
 *  Main function that creates the index and upserts the documents.
 */
async function main() {
    const index = "space-facts-index";

    if (
        !process.env.SECRET_AZURE_SEARCH_KEY ||
        !process.env.AZURE_SEARCH_ENDPOINT ||
        !process.env.SECRET_AZURE_OPENAI_API_KEY ||
        !process.env.AZURE_OPENAI_ENDPOINT ||
        !process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME
    ) {
        throw new Error(
            "Missing environment variables - please check that SECRET_AZURE_SEARCH_KEY, AZURE_SEARCH_ENDPOINT, SECRET_AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME are set."
        );
    }

    const searchApiKey = process.env.SECRET_AZURE_SEARCH_KEY;
    const searchApiEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const credentials = new AzureKeyCredential(searchApiKey);

    const searchIndexClient = new SearchIndexClient(searchApiEndpoint, credentials);
    createIndexIfNotExists(searchIndexClient, index);
    // Wait 5 seconds for the index to be created
    await delay(5000);

    const searchClient = new SearchClient(searchApiEndpoint, index, credentials);

    const filePath = path.join(__dirname, "./data");
    const files = fs.readdirSync(filePath);
    const data = [];
    for (let i=1;i<=files.length;i++) {
        const content = fs.readFileSync(path.join(filePath, files[i-1]), "utf-8");
        data.push({
            docId: i+"",
            docTitle: files[i-1],
            description: content,
            descriptionVector: await getEmbeddingVector(content),
        });
    }
    await upsertDocuments(searchClient, data);
}

main();

module.exports = main;
