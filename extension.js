const vscode = require('vscode');

const TYPES = {
    if: {
        label: 'if (...) { ... }',
        prompt: 'Условие:',
        make: c => [`if (${c}) {`, '}']
    },
    elseIf: {
        label: 'else if (...) { ... }',
        prompt: 'Условие:',
        make: c => [`else if (${c}) {`, '}']
    },
    else: {
        label: 'else { ... }',
        prompt: null,
        make: () => ['else {', '}']
    },
    while: {
        label: 'while (...) { ... }',
        prompt: 'Условие:',
        make: c => [`while (${c}) {`, '}']
    },
    for: {
        label: 'for (...) { ... }',
        prompt: 'Заголовок без for:',
        defaultValue: 'int i = 0; i < n; i++',
        make: c => [`for (${c}) {`, '}']
    },
    doWhile: {
        label: 'do { ... } while (...);',
        prompt: 'Условие while:',
        make: c => ['do {', `} while (${c});`]
    }
};

function activate(context) {
    const disposable = vscode.commands.registerCommand('smartWrapper.wrap', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const sel = editor.selection;
        if (sel.isEmpty) {
            vscode.window.showWarningMessage('Wrapper: сначала выделите код.');
            return;
        }

        const items = Object.entries(TYPES).map(([id, t]) => ({ label: t.label, id }));
        const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Во что обернуть?' });
        if (!picked) return;

        const t = TYPES[picked.id];

        let arg = '';
        if (t.prompt !== null) {
            const input = await vscode.window.showInputBox({
                prompt: t.prompt,
                value: t.defaultValue || ''
            });
            if (input === undefined) return;
            arg = input;
        }

        const [before, after] = t.make(arg);

        const startLine = sel.start.line;
        const endLine = sel.end.line;

        const firstLineText = editor.document.lineAt(startLine).text;
        const indentMatch = firstLineText.match(/^[ \t]*/);
        const indent = indentMatch ? indentMatch[0] : '';
        const innerIndent = indent + '    ';

        const lines = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(editor.document.lineAt(i).text);
        }

        const stripped = lines.map(l => l.startsWith(indent) ? l.slice(indent.length) : l);
        const indented = stripped.map(l => l.length === 0 ? l : innerIndent + l).join('\n');
        const replacement = indent + before + '\n' + indented + '\n' + indent + after;

        const endLineText = editor.document.lineAt(endLine).text;
        const range = new vscode.Range(startLine, 0, endLine, endLineText.length);

        await editor.edit(builder => {
            builder.replace(range, replacement);
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = { activate, deactivate };