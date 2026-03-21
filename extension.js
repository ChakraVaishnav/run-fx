const vscode = require('vscode');
const sound = require('sound-play');
const path = require('path');

function activate(context) {
    const SOUND_KEY = 'runfx.customSound';
    const SOUND_HISTORY_KEY = 'runfx.soundHistory';

    // Store recent commands in globalState
    const RECENT_KEY = 'runfx.recentCommands';
    const MAX_RECENT = 10;

    const disposable = vscode.commands.registerCommand('runfx.runCommand', async () => {
        let recent = context.globalState.get(RECENT_KEY, []);
        // Show recent commands as quick pick
        let items = recent.map(cmd => ({ label: cmd, description: 'Recent command' }));
        items.unshift({ label: '$(plus) Enter new command', description: 'Type a new command to run' });


        /**
         * pick is always an object with 'label' and 'description' properties
         * @type {{label: string, description: string} | undefined}
         */
        // @ts-ignore
        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select or enter a command to run'
        });
		
        if (!pick) return;

        let command;
        if (pick.label === '$(plus) Enter new command') {
            command = await vscode.window.showInputBox({
                placeHolder: 'Enter command (e.g. npm run dev, python main.py)'
            });
            if (!command) return;
        } else {
            command = pick.label;
        }

        // Only update and run if command is valid
        if (command && command !== '$(plus) Enter new command') {
            // Update recent commands
            recent = recent.filter(cmd => cmd !== command);
            recent.unshift(command);
            if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
            context.globalState.update(RECENT_KEY, recent);

            // Determine cwd: active file's folder, or workspace root
            let cwd = undefined;
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.scheme === 'file') {
                const filePath = activeEditor.document.uri.fsPath;
                cwd = require('path').dirname(filePath);
            } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }

            const terminal = vscode.window.createTerminal({
                name: "RunFX",
                cwd: cwd
            });
            terminal.show();
            playSound(context);
            terminal.sendText(command);
        }
    });
    context.subscriptions.push(disposable);

    // Status Bar Button
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBar.text = "▶ RunFX";
    statusBar.command = "runfx.runCommand";
    statusBar.show();
    context.subscriptions.push(statusBar);

    // Command: Set Sound
    const setSoundDisposable = vscode.commands.registerCommand('runfx.setSound', async () => {
        let currentSound = context.globalState.get(SOUND_KEY);
        let soundHistory = context.globalState.get(SOUND_HISTORY_KEY, []);
        if (currentSound && !soundHistory.includes(currentSound)) {
            soundHistory.unshift(currentSound);
        }
        // Build quick pick items
        let items = [];
        if (currentSound) {
            items.push({ label: '$(unmute) Current: ' + currentSound, description: 'Currently selected sound', alwaysShow: true });
        } else {
            items.push({ label: '$(unmute) Default sound (engine.mp3)', description: 'Currently using default', alwaysShow: true });
        }
        if (soundHistory.length > 0) {
            items = items.concat(soundHistory.map(snd => ({ label: snd, description: 'Previously used sound' })));
        }
        // @ts-ignore
        items.push({ label: '$(plus) Select new sound file', description: 'Pick a new audio file' });

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a sound to use for RunFX',
            ignoreFocusOut: true
        });
        if (!pick) return;

        let selectedSound;
        if (pick.label === '$(plus) Select new sound file') {
            const file = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Select Sound File',
                filters: {
                    'Audio': ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']
                }
            });
            if (file && file[0]) {
                selectedSound = file[0].fsPath;
            } else {
                return;
            }
        } else if (pick.label.startsWith('$(unmute)')) {
            // Current/default, do nothing
            vscode.window.showInformationMessage('Already using this sound.');
            return;
        } else {
            selectedSound = pick.label;
        }

        if (selectedSound) {
            // Update current and history
            await context.globalState.update(SOUND_KEY, selectedSound);
            soundHistory = soundHistory.filter(snd => snd !== selectedSound);
            soundHistory.unshift(selectedSound);
            if (soundHistory.length > 10) soundHistory = soundHistory.slice(0, 10);
            await context.globalState.update(SOUND_HISTORY_KEY, soundHistory);
            vscode.window.showInformationMessage('RunFX: Custom sound set!');
        }
    });
    context.subscriptions.push(setSoundDisposable);
}

function playSound(context) {
    const SOUND_KEY = 'runfx.customSound';
    let soundPath = context.globalState.get(SOUND_KEY);
    if (!soundPath) {
        soundPath = path.join(context.extensionPath, 'sounds', 'engine.mp3');
    }
    sound.play(soundPath).catch((err) => {
        console.log("Sound error:", err);
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};