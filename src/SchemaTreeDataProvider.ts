import * as vscode from "vscode";
import SchemaModel from "./SchemaModel";
import SchemaNode from "./SchemaNode";

export default class SchemaTreeDataProvider
  implements vscode.TreeDataProvider<SchemaNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor(private readonly model: SchemaModel) {}

  public refresh(): any {
    this._onDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: SchemaNode): vscode.TreeItem {
    return {
      label: element.label,
      contextValue: element.isTable ? "schemaTable" : "schemaField",
      collapsibleState: element.isTable
        ? vscode.TreeItemCollapsibleState.Collapsed
        : void 0,
    };
  }

  public getChildren(
    element?: SchemaNode
  ): SchemaNode[] | Thenable<SchemaNode[]> {
    return element ? element.children : this.model.data;
  }

  public getParent(element: SchemaNode): SchemaNode | undefined {
    return element.parent;
  }
}
