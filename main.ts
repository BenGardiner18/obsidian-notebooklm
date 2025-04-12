import { App, Plugin, PluginSettingTab } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './views/itemView';

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SettingsComponent } from './components/SettingsTab';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	openaiApiKey: string;
	podcastDurationMinutes: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	openaiApiKey: '',
	podcastDurationMinutes: 3
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf, this)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('microphone', 'AI Podcast Generator', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Add a command to open the podcast generator
		this.addCommand({
			id: 'open-podcast-generator',
			name: 'Open AI Podcast Generator',
			callback: () => {
				this.activateView();
			}
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('AI Podcast Generator Ready');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new ReactModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new ReactModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ReactSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Helper function to activate the music player view
	async activateView() {
		const { workspace } = this.app;
		
		// Check if the view is already open
		const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
		
		if (existingLeaf) {
			workspace.revealLeaf(existingLeaf);
			return;
		}
		
		// Open the view in a new leaf
		await workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_EXAMPLE,
			active: true,
		});
	}
}

class ReactSettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	private root: Root | null = null;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		const reactContainer = containerEl.createDiv();
		this.root = createRoot(reactContainer);
		
		this.root.render(
			React.createElement(SettingsComponent, {
				plugin: this.plugin,
				settings: this.plugin.settings,
				onSettingChange: async (setting: string, value: any) => {
					(this.plugin.settings as any)[setting] = value;
					await this.plugin.saveSettings();
				}
			})
		);
	}

	hide(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
