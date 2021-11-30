import * as vscode from "vscode";
import SchemaNode from "./SchemaNode";
import SchemaModel from "./SchemaModel";
import {
  getCurrentTableName,
  getSchemaUri,
  lookForCustomTableName,
} from "./fileUtils";
import SchemaTreeDataProvider from "./SchemaTreeDataProvider";

export class SchemaExplorer {
  private schemaModel: SchemaModel;
  private schemaViewer: vscode.TreeView<SchemaNode>;

  constructor(context: vscode.ExtensionContext) {
    this.schemaModel = new SchemaModel(() => this.reveal());
    const treeDataProvider = new SchemaTreeDataProvider(this.schemaModel);
    this.schemaViewer = vscode.window.createTreeView("RailsSchema", {
      treeDataProvider,
    });

    let disposable = vscode.commands.registerCommand(
      "rails-schema.showRailsSchema",
      () => this.reveal()
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "rails-schema.openInSchema",
        (node: SchemaNode) => {
          const uri = getSchemaUri();
          if (uri === undefined) {
            return;
          }

          vscode.workspace
            .openTextDocument(uri)
            .then((document: vscode.TextDocument) => {
              this.openInSchema(document, node);
            });
        }
      )
    );

    context.subscriptions.push(disposable);
  }

  private async openInSchema(
    document: vscode.TextDocument,
    node: SchemaNode
  ): Promise<void> {
    const lineCount = document.lineCount;
    let tableLine = 0;

    for (let index = 0; index < lineCount; index++) {
      const schemaTextLine = document.lineAt(index);
      if (
        schemaTextLine.text
          .trimLeft()
          .startsWith(`create_table "${node.label}"`)
      ) {
        tableLine = index;
      }
    }

    const editor = await vscode.window.showTextDocument(document.uri);
    const position = new vscode.Position(tableLine, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
  }

  private reveal(): void {
    const currentTable = getCurrentTableName();
    let node = this.getNode(currentTable);
    if (node) {
      this.schemaViewer.reveal(node, {
        expand: true,
        select: true,
        focus: true,
      });
    } else {
      lookForCustomTableName((customTableName: string | null) => {
        node = this.getNode(customTableName);
        if (node) {
          this.schemaViewer.reveal(node, {
            expand: true,
            select: true,
            focus: true,
          });
        } else {
          const schemaNodes = this.schemaModel.data;
          this.schemaViewer.reveal(schemaNodes[0], {
            expand: false,
            select: true,
            focus: true,
          });
        }
      });
    }
  }

  private getNode(label: string | null): SchemaNode | undefined {
    const schemaNodes = this.schemaModel.data;
    if (schemaNodes.length === 0) {
      return undefined;
    }

    return schemaNodes.find((node) => {
      if (node.label === label) {
        return node;
      }
    });
  }
}
