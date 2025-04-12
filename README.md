# Obsidian AI Podcast Generator

Convert your notes and knowledge base into engaging AI-generated podcast conversations.

## Features

- 🎙️ Transform your notes into natural-sounding podcast scripts
- 🗣️ Generate realistic TTS audio of conversations
- 📝 Automatically uses your currently opened note as context
- 🔍 Search and select additional notes for more comprehensive context
- 👥 Pre-configured podcast host characters
- ⏱️ Adjustable podcast duration
- 📜 View full script alongside audio player

## Prerequisites

- Node.js and npm
- OpenAI API key (with access to GPT-4o and TTS models)

## Installation

1. Clone the repository
2. Install dependencies
```bash
npm install
```

3. Build the plugin:
```bash
npm run dev
```

## Adding to Obsidian

1. Create a folder in your `.obsidian/plugins/` directory called `obsidian-ai-podcast`
2. Copy the `main.js`, `manifest.json`, and `styles.css` files to that folder
3. Enable the plugin in Obsidian's settings
4. Add your OpenAI API key in the plugin settings

## Usage

1. Open a note you want to use as the main context
2. Click the microphone icon in the ribbon or use the "Open AI Podcast Generator" command
3. Search and select additional notes from your vault to include as context (optional)
4. Click "Generate Script" to create a podcast script based on your selected content
5. Click "Generate Audio" to create and play the AI-generated podcast

## Settings

The plugin has two configurable settings:
- **OpenAI API Key**: Required for generating scripts and audio
- **Podcast Duration (minutes)**: Set the target length of the generated podcast

## Security Note

The plugin requires an OpenAI API key to function. Your API key is stored locally in your Obsidian configuration.
Never share your API key or plugin data with others.

## License

MIT
