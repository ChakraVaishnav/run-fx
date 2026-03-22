const assert = require('assert');
const vscode = require('vscode');

suite('RunFX Extension Test Suite', () => {
    test('Extension should be present', async () => {
        const ext = vscode.extensions.getExtension('ChakraVaishnavReddy.runfx');
        assert.ok(ext, 'Extension not found');
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('runfx.runCommand'), 'runfx.runCommand not registered');
        assert.ok(commands.includes('runfx.setSound'), 'runfx.setSound not registered');
    });

    // This test only checks that the command can be executed without throwing
    test('runfx.runCommand should execute', async () => {
        try {
            await vscode.commands.executeCommand('runfx.runCommand');
        } catch (e) {
            assert.fail('runfx.runCommand failed to execute: ' + e.message);
        }
    });

    test('runfx.setSound should execute', async () => {
        try {
            await vscode.commands.executeCommand('runfx.setSound');
        } catch (e) {
            assert.fail('runfx.setSound failed to execute: ' + e.message);
        }
    });
});
