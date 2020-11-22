// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'cpp-cmake-project-generator.createProject',
    () => {
      // First, create a CMake project using the cmake tools extension from microsoft
      // TODO doesn't work if the user presses create new cmakelists
      // I have kind of fixed this by displaying an error message
      vscode.commands.executeCommand('cmake.quickStart').then(() => {
        // If there is no active folder, exit command
        // TODO The CMake tools extension throws error, so this isn't needed
        if (vscode.workspace.workspaceFolders === undefined) {
          vscode.window.showErrorMessage('Error: Please open a folder first.');
          return;
        }

        const folderPath = vscode.workspace.workspaceFolders[0].uri
          .toString()
          .split(':')[1];

        // Cancel if the CMake Tools extension didn't work
        if (!fs.existsSync(path.join(folderPath, 'CMakeLists.txt'))) {
          vscode.window.showErrorMessage(
            'CMake Tools extenstion failed to create project, please exit and try again'
          );
          // TODO delete build folder
          fs.rmdir(path.join(folderPath, 'build'), (err) => {
            vscode.window.showErrorMessage('Error deleting build folder'); // TODO make this error message better
          });
          return;
        }

        // Add src and include directories
        fs.mkdir(path.join(folderPath, 'src'), (err) => {
          vscode.window.showErrorMessage(err.toString());
        });
        fs.mkdir(path.join(folderPath, 'include'), (err) => {
          vscode.window.showErrorMessage(err.toString());
        });

        // Modify CMakeLists.txt to use include and src directories
        const add =
          'include_directories(include)\nfile(GLOB SOURCES src/*.cpp)\nadd_executable(${PROJECT_NAME} ${SOURCES})';
        fs.readFile(
          path.join(folderPath, 'CMakeLists.txt'),
          'ascii',
          (err, CMakeLists) => {
            // Insert add variable into CMakeLists
            const startInsert = CMakeLists.indexOf('add_executable');
            let endInsert = startInsert;
            for (let i = startInsert; CMakeLists.toString()[i] != ')'; ++i) {
              endInsert++;
            }
            CMakeLists =
              CMakeLists.toString().slice(0, startInsert) +
              add +
              CMakeLists.toString().slice(endInsert + 1);

            // Rewrite CMakeLists.txt
            fs.writeFile(path.join(folderPath, 'CMakeLists.txt'), CMakeLists, (err) => {
              vscode.window.showErrorMessage(err.toString());
            });

            // Move main.cpp to src folder
            fs.rename(
              path.join(folderPath, 'main.cpp'),
              path.join(folderPath, 'src', 'main.cpp'),
              (err) => {
                vscode.window.showErrorMessage(err.toString());
              }
            );
          }
        );
      });
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
